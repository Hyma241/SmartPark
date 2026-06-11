import requests, time, json, subprocess, sys, os

BASE_URL = 'http://localhost:8000/api'

def log(msg):
    print(f'--- {msg} ---')

def health_check():
    try:
        r = requests.get(f'{BASE_URL}/health')
        print('Health:', r.json())
    except Exception as e:
        print('Health check failed:', e)
        sys.exit(1)

def clean_camera(cam_id):
    try:
        r = requests.delete(f'{BASE_URL}/cameras/{cam_id}')
        print('Delete camera response:', r.status_code)
    except Exception as e:
        print('Delete error:', e)

def add_camera():
    payload = {
        'cam_id': 'cam_test',
        'url': 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
        'name': 'orange',
        'location': 'slot A'
    }
    r = requests.post(f'{BASE_URL}/cameras/add', json=payload)
    print('Add camera response status:', r.status_code)
    print('Response json:', r.json())
    return r.ok

def list_cameras():
    r = requests.get(f'{BASE_URL}/cameras/status')
    print('Camera list:', r.json())

def get_statistics():
    r = requests.get(f'{BASE_URL}/parking/statistics')
    print('Statistics:', json.dumps(r.json(), indent=2)[:500])

def restart_docker():
    log('Restarting Docker compose')
    # Assuming docker-compose.yml is at project root
    cwd = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    subprocess.run(['docker', 'compose', '-f', 'docker-compose.yml', 'down'], cwd=cwd)
    subprocess.run(['docker', 'compose', '-f', 'docker-compose.yml', 'up', '-d', '--build'], cwd=cwd)
    log('Waiting for services to become ready')
    time.sleep(15)

if __name__ == '__main__':
    health_check()
    clean_camera('cam_test')
    add_camera()
    list_cameras()
    get_statistics()
    # Verify persistence after restart
    restart_docker()
    health_check()
    list_cameras()
    get_statistics()
