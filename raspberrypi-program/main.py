import argparse
from gpiozero import Button, LED
import json
import requests

parser = argparse.ArgumentParser()

# Required arguments
parser.add_argument("--ledpin", type=int, required=True)
parser.add_argument("--btnpin", type=int, required=True)
parser.add_argument("--baseurl", type=str, required=True)
parser.add_argument("--key", type=str, required=True)

# Message fetch group
msg_src_group = parser.add_mutually_exclusive_group(required=True)
msg_src_group.add_argument("--msgpath", type=str)
msg_src_group.add_argument("--msgurl", type=str)

args = parser.parse_args()

api_url = f"{args.baseurl}/notifications?key={args.key}"

led = LED(args.ledpin)
button = Button(args.btnpin)

def get_message():
        if args.msgpath:
                with open(args.msgpath, "r") as file:
                        return json.loads(file.read())

        if args.msgurl:
                msg_get_response = requests.get(args.msgurl)
                return msg_get_response.json()

while True:
        led.on()
        button.wait_for_press()

        led.off()
        message = get_message()
        post_data = requests.post(url = api_url, data = message)

        if not post_data.ok:
                led.blink(on_time=0.2, off_time=0.2, n=3, background=False)
