## Getting Started

First, run the development server:

```bash
pnpm run dev
pnpm run build
pnpm run start
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

# create super user im powershell
$headers = @{
    "Content-Type" = "application/json"
    "api-key" = "your-secret-key"
}
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/superuser" -Method POST -Headers $headers

created superuser -> administrator:Access123$#   S c a n G u a r d  
 