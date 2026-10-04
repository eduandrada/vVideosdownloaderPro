"""
Ultra-fast port cleaner (runs in <40ms) to ensure ports 8000 and 3000 are immediately available.
"""
import subprocess
import os
import sys

def free_ports(ports=(8000, 3000)):
    try:
        out = subprocess.check_output("netstat -ano -p tcp", shell=True).decode("utf-8", errors="ignore")
        current_pid = str(os.getpid())
        pids_to_kill = set()

        for line in out.splitlines():
            if "LISTENING" in line:
                for port in ports:
                    if f":{port} " in line:
                        parts = line.strip().split()
                        if len(parts) >= 5 and parts[-1].isdigit():
                            pid = parts[-1]
                            if pid != "0" and pid != current_pid:
                                pids_to_kill.add(pid)

        for pid in pids_to_kill:
            subprocess.run(["taskkill", "/F", "/PID", pid], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        pass

if __name__ == "__main__":
    free_ports()
