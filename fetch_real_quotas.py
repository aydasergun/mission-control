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

def get_quotas(access, project_id):
    # This is a guess at the quota endpoint based on common Google Cloud Assist patterns
    url = f"https://cloudaicompanion.googleapis.com/v1/projects/{project_id}/locations/global/quotas"
    headers = {
        "Authorization": f"Bearer {access}",
        "Content-Type": "application/json"
    }
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        return resp.json()
    except Exception as e:
        return {"error": str(e)}

def main():
    path = "/home/ayda/.openclaw/agents/main/agent/auth-profiles.json"
    try:
        with open(path, "r") as f:
            data = json.load(f)
            profiles = data["profiles"]
            last_good = data.get("lastGood", {}).get("google-antigravity", "")
    except:
        print(json.dumps({"error": "Profiles file not found"}))
        return

    results = []
    for pid, profile in profiles.items():
        if profile.get("provider") != "google-antigravity": continue
        
        email = profile.get("email")
        refresh = profile.get("refresh")
        project_id = profile.get("projectId", "rising-fact-p41fc")
        
        # In a real dashboard, we'd cache these. For now, let's just refresh the current one 
        # and mock the others to be fast, or try to refresh all if they are few.
        # Since we have 7 accounts, let's try to get real data for all.
        
        token = refresh_token(refresh)
        quota_data = {}
        if token:
            quota_data = get_quotas(token, project_id)
            
        results.append({
            "email": email,
            "id": pid,
            "isCurrent": pid == last_good,
            "raw_quotas": quota_data,
            "expiresAt": profile.get("expires")
        })
            
    print(json.dumps(results))

if __name__ == "__main__":
    main()
