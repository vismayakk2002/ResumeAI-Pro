import json
import urllib.request
import urllib.error

BASE = "http://127.0.0.1:8000"


def http_json(method: str, path: str, payload: dict | None = None):
    url = BASE + path
    data = None
    headers = {}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"raw": body}


def main():
    print("GET /auth/me without token")
    print(http_json("GET", "/auth/me"))

    signup_payload = {
        "name": "Test User",
        "email": "testuser@example.com",
        "password": "StrongPass123",
    }
    print("POST /auth/signup")
    print(http_json("POST", "/auth/signup", signup_payload))

    login_payload = {
        "email": "testuser@example.com",
        "password": "StrongPass123",
    }
    print("POST /auth/login")
    status, login_resp = http_json("POST", "/auth/login", login_payload)
    print(status, login_resp)

    token = login_resp.get("access_token")
    if not token:
        raise SystemExit("No access_token returned")

    print("GET /auth/me with token")
    req = urllib.request.Request(
        BASE + "/auth/me",
        method="GET",
        headers={"Authorization": f"Bearer {token}"},
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print(resp.status, json.loads(resp.read().decode("utf-8")))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        print(e.code, body)


if __name__ == "__main__":
    main()

