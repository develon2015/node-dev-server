use std::{ffi::c_void, ptr::null, str::FromStr};

#[link(name = "Kernel32", kind = "dylib")]
#[link(name = "User32", kind = "dylib")]
extern "C" {
    fn GetCurrentProcessId() -> u32;
    fn GetLastError() -> u32;
    fn SetWindowsHookExW(
        idHook: u32,
        // lpfn: extern "C" fn(),
        lpfn: *const c_void, // 也可以使用裸指针
        hMod: *const c_void,
        dwThreadId: u32,
    ) -> *const c_void;
    fn GetMessageW(
        lpMsg: *mut u8,
        hWnd: *const c_void,
        wMsgFilterMin: u32,
        wMsgFilterMax: u32,
    ) -> i32;
    fn TranslateMessage(lpMsg: *const u8) -> i32;
    fn DispatchMessageW(lpMsg: *const u8) -> i32;
    fn CallNextHookEx(
        hhk: *const c_void,
        nCode: i32,
        wParam: u64,
        lParam: *const u8,
    ) -> i64;
}

type HookProc = extern "C" fn (nCode: i32, wParam: u64, lParam: *const u8) -> i64;

#[repr(C)]
#[derive(Copy, Clone)]
struct KBDLLHOOKSTRUCT {
    vkCode: u32,
    scanCode: u32,
    flags: u32,
    time: u32,
    dwExtraInfo: u64,
}

pub static mut X: bool = false;

extern "C" fn callback(
    nCode: i32,
    wParam: u64,
    lParam: *const u8,
) -> i64 {
    unsafe {
        if nCode == 0 {
            let kb = *(lParam as *const _ as *const KBDLLHOOKSTRUCT);
            const WM_SYSKEYDOWN: u64 = 0x104;
            const WM_SYSKEYUP: u64 = 0x105;
            const WM_KEYDOWN: u64 = 0x100;
            const WM_KEYUP: u64 = 0x101;
            const VK_LCONTROL: u32 = 0xA2;
            if wParam == WM_SYSKEYDOWN || wParam == WM_KEYDOWN {
                if kb.vkCode == VK_LCONTROL {
                    X = true;
                } else if X && kb.vkCode == 'R' as u32 { // 按下了快捷键Ctrl+R
                    let addr = std::net::SocketAddr::from_str("127.0.0.1:4444").unwrap();
                    if let Err(e) = std::net::TcpStream::connect_timeout(&addr, std::time::Duration::from_millis(100)) {
                        println!("{}", e);
                    }
                    return 1; // 取消默认操作
                }
            } else if wParam == WM_SYSKEYUP || wParam == WM_KEYUP {
                if kb.vkCode == VK_LCONTROL {
                    X = false;
                }
            }
        }
        CallNextHookEx(null(), nCode, wParam, lParam)
    }
}

fn hook() {
    let callback = &(callback as HookProc) as *const _ as *const *const c_void;
    let raw_pointer = unsafe { *callback }; // 使用一个临时指针对fn()进行引用, 然后进行unsafe解引用, 从而将fn()转换为裸指针
    unsafe { SetWindowsHookExW(13, raw_pointer, null(), 0) };
    let mut msg = [0u8; 48];
    let msg = msg.as_mut_ptr();
    loop {
        unsafe {
            if GetMessageW(msg, null(), 0, 0) == -1 {
                // println!("GetMessageW failed: {}", GetLastError());
                break;
            }
            TranslateMessage(msg);
            DispatchMessageW(msg);
        }
    }
}

#[no_mangle]
extern "C" fn DllMain(_hinst: *const u8, reason: u32, _reserved: *const u8) -> u32 {
    match reason {
        1 => {
            std::thread::spawn(|| {
                hook();
            });
        }
        0 => {
            // println!("DLL_PROCESS_DETACH");
        }
        _ => {}
    }
    return 1;
}

#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        std::net::TcpStream::connect("").unwrap();
    }
}
