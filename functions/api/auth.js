// functions/api/auth.js
// Step 1 of login: redirects you to GitHub's own login/approval screen.
// GITHUB_CLIENT_ID is set later in Cloudflare's dashboard — never written in code directly.

export async function onRequest(context) {
  const clientId = context.env.GITHUB_CLIENT_ID;
  const redirectUri = new URL("/api/callback", context.request.url).toString();

  const githubAuthUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=repo,user`;

  return Response.redirect(githubAuthUrl, 302);
}
