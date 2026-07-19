Set WshShell = CreateObject("WScript.Shell") 
Set Shortcut = WshShell.CreateShortcut("C:\Users\DELL\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\SP System Print Agent.lnk") 
Shortcut.TargetPath = "wscript.exe" 
Shortcut.Arguments = "//nologo " & chr(34) & "C:\Users\DELL\pulperia-system\print-agent\run-agent.vbs" & chr(34) 
Shortcut.WorkingDirectory = "C:\Users\DELL\pulperia-system\print-agent\" 
Shortcut.WindowStyle = 7 
Shortcut.Save 
