import json
import requests
import sys

CLIENT_ID = "1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com"
CLIENT_SECRET = "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"

def refresh_token(refresh):
    url = "https://oauth2.googleapis.com/token"
    data = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "refresh_token": refresh,
        "grant_type": "refresh_token"
    }
    try:
        resp = requests.post(url, data=data, timeout=10)
        return resp.json().get("access_token")
    except:
        return None

def get_quotas(access):
    url = "https://cloudcode-pa.googleapis.com/v1internal:loadCodeAssist"
    headers = {
        "Authorization": f"Bearer {access}",
        "Content-Type": "application/json",
        "User-Agent": "google-api-nodejs-client/9.15.1",
        "X-Goog-Api-Client": "google-cloud-sdk vscode_cloudshelleditor/0.1"
    }
    payload = {
        "metadata": {
            "ideType": "IDE_UNSPECIFIED",
            "platform": "PLATFORM_UNSPECIFIED",
            "pluginType": "GEMINI"
        }
    }
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=10)
        return resp.json()
    except Exception as e:
        return {"error": str(e)}

def main():
    path = "/home/ayda/.openclaw/agents/main/agent/auth-profiles.json"
    try:
        with open(path, "r") as f:
            profiles = json.load(f)["profiles"]
    except:
        print(json.dumps({"error": "Profiles file not found"}))
        return

    results = []
    for pid, profile in profiles.items():
        if profile.get("provider") != "google-antigravity":
            continue
        
        email = profile.get("email")
        refresh = profile.get("refresh")
        
        token = refresh_token(refresh)
        if not token:
            results.append({"email": email, "error": "Token refresh failed"})
            continue
            
        quotas = get_quotas(token)
        results.append({
            "email": email,
            "id": pid,
            "quotas": quotas
        })
            
    print(json.dumps(results))

if __name__ == "__main__":
    main()
