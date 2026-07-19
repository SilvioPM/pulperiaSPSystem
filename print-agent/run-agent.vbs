Set WshShell = CreateObject("WScript.Shell") 
WshShell.Run "cmd /c start /b node """ & chr(34) & "C:\Users\DELL\pulperia-system\print-agent\server.js" & chr(34) & """", 0, False 
