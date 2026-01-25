import os
import subprocess
import time
import sys

# Configuration
IMAGE_NAME = "glassy-dash:prod"
ARTIFACT_NAME = "glassy-dash.tar.gz"
JUMP_HOST = "glassy-jump"
VM_HOST = "glassy-vm"
VM_IP = "192.168.122.45"
VM_USER = "pozi"

def run_command(cmd, shell=False):
    print(f"--> Running: {' '.join(cmd) if isinstance(cmd, list) else cmd}")
    try:
        if shell:
            subprocess.check_call(cmd, shell=True)
        else:
            subprocess.check_call(cmd)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {e}")
        return False

def build_local():
    print(f"\n[1/4] Building Docker Image Locally ({IMAGE_NAME})...")
    if not run_command(["docker", "build", "-t", IMAGE_NAME, "."]):
        return False
    
    print(f"\n[2/4] Saving and Compressing Artifact ({ARTIFACT_NAME})...")
    # Pipe docker save to gzip
    cmd = f"docker save {IMAGE_NAME} | gzip > {ARTIFACT_NAME}"
    if not run_command(cmd, shell=True):
        return False
    
    size_mb = os.path.getsize(ARTIFACT_NAME) / (1024 * 1024)
    print(f"    Artifact size: {size_mb:.2f} MB")
    return True

def ship_artifact():
    print(f"\n[3/4] Shipping Artifact to {VM_HOST} (Tunneling through Jump Host)...")
    
    # Direct SCP with ProxyJump
    # This uses local keys to auth to both machines, bypassing Jump Host's key issues
    print(f"    Transferring {ARTIFACT_NAME} -> {VM_IP}...")
    cmd = ["scp", "-o", f"ProxyJump={JUMP_HOST}", ARTIFACT_NAME, f"{VM_USER}@{VM_IP}:~/"]
    
    if not run_command(cmd):
        return False
        
    return True

def run_remote():
    print(f"\n[4/4] Loading and Running on VM...")
    
    # We construct a single script to run on the VM
    # Note: We use gunzip -c to stream unzip into docker load
    remote_script = f"""
    echo '--> Loading image...'
    gunzip -c ~/{ARTIFACT_NAME} | sudo docker load
    
    echo '--> Cleaning up old container...'
    sudo docker rm -f GLASSYDASH 2>/dev/null || true
    
    echo '--> Starting application...'
    sudo docker run -d \\
      --name GLASSYDASH \\
      --restart unless-stopped \\
      -p 3001:8080 \\
      -e NODE_ENV=production \\
      -e API_PORT=8080 \\
      -e JWT_SECRET="deployed-secret-key-prod" \\
      -e DB_FILE="/app/data/notes.db" \\
      -e ADMIN_EMAILS="admin" \\
      -e ALLOW_REGISTRATION=false \\
      -v ~/.GLASSYDASH:/app/data \\
      {IMAGE_NAME}
      
    echo '--> Verifying...'
    sudo docker ps | grep GLASSYDASH
    """
    
    # Execute the script via SSH with ProxyJump
    # ssh -J glassy-jump pozi@192.168.122.45 'script'
    ssh_cmd = ["ssh", "-J", JUMP_HOST, f"{VM_USER}@{VM_IP}", remote_script]
    
    if not run_command(ssh_cmd):
        return False
        
    return True

if __name__ == "__main__":
    if not os.path.exists("Dockerfile"):
        print("Error: Run this script from the project root (where Dockerfile is).")
        sys.exit(1)

    if build_local():
        if ship_artifact():
            if run_remote():
                print("\n✅ Deployment to PROD Complete!")
                print(f"Check availability at http://dash.0rel.com (if proxy is configured) or http://{JUMP_HOST}:3001 via tunnel.")
            else:
                print("\n❌ Remote Run Failed")
        else:
            print("\n❌ Shipping Failed")
    else:
        print("\n❌ Build Failed")
