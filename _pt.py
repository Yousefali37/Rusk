import hashlib, json, time, urllib.request

BASE = "https://rusk-cafe.vercel.app"
TOKEN = hashlib.sha256(b"RuskAdmin").hexdigest()

def get_json(path):
    req = urllib.request.Request(BASE + path)
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)

def put(path, body):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(body).encode(),
        headers={
            "Content-Type": "application/json",
            "Authorization": "Bearer " + TOKEN,
        },
        method="PUT",
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)

site = get_json("/api/site")
print("before today_badge:", repr(site.get("today_badge")))
print("before social_talabat:", repr(site.get("social_talabat")))

marker = "PROBE-" + str(int(time.time()))
print("setting marker:", marker)
print("put:", put("/api/admin/site", {"today_badge": marker}))

site2 = get_json("/api/site")
print("after marker  today_badge:", repr(site2.get("today_badge")))