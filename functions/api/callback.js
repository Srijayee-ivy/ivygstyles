// functions/api/callback.js
// Step 2 of login: GitHub redirects here after approval with a temporary code.
// This exchanges that code for a real access token, then hands it to the CMS admin panel.

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("Missing code from GitHub.", { status: 400 });
  }

  const clientId = context.env.GITHUB_CLIENT_ID;
  const clientSecret = context.env.GITHUB_CLIENT_SECRET;

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
    }),
  });

  const tokenData = await tokenResponse.json();

  if (tokenData.error) {
    return new Response("Login failed: " + tokenData.error_description, { status: 400 });
  }

  const accessToken = tokenData.access_token;

  // Hands the token back to the CMS tab/window that started the login.
  const script = `
    <script>
      (function() {
        function receiveMessage(message) {
          window.opener.postMessage(
            'authorization:github:success:${JSON.stringify({ token: accessToken, provider: "github" })}',
            message.origin
          );
          window.removeEventListener("message", receiveMessage, false);
        }
        window.addEventListener("message", receiveMessage, false);
        window.opener.postMessage("authorizing:github", "*");
      })();
    </script>
  `;

  return new Response(script, {
    headers: { "Content-Type": "text/html" },
  });
}
