import requests
import os
import time

def set_output(key, value):
    file_path = os.getenv("GITHUB_OUTPUT")
    with open(file_path, 'a') as file:
        print(f"{key}={value}", file=file)

def ping_url(url, delay, max_trials):
    trials = 0
    while trials < max_trials:
        print (f"Trial {trials+1} of {max_trials}")
        try:
            response = requests.get(url)
            if response.status_code == 200:
                print(f"Website {url} is reachable.")
                return True
        except requests.ConnectionError:
            print(f"Website {url} is unreachable. Retrying in {delay} seconds")
            time.sleep(delay)
            trials += 1
        except requests.exceptions.MissingSchema:
            print(f"Invalid url ${url}")
            return False
        
    return False



def run():
    print (os.environ)
    website_url=os.getenv("INPUT_URL")
    delay=int(os.getenv("INPUT_DELAY"))
    max_trails=int(os.getenv("INPUT_MAX_TRIALS"))

    website_reachable = ping_url(website_url, delay, max_trails)

    set_output('website-reachable', website_reachable)

    if not website_reachable:
        raise Exception(f"Website URL {website_url} is not reachable.")
    
    print (f"Website URL {website_url} is reachable.")

if __name__ == "__main__":
    run()