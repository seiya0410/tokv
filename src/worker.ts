declare var BLOG_POSTS: KVNamespace;

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request: Request): Promise<Response> {
  let response;

  if (request.method === "OPTIONS") {
    // Handle CORS preflight requests. This is required for CORS requests with
    // certain types of headers or HTTP methods (like a POST request with a JSON body).
    response = new Response(null, { status: 204 });
  } else if (request.method === "GET") {
    const url = new URL(request.url);
    if (url.pathname === "/index") {
      // Fetch index of post IDs
      const index = await BLOG_POSTS.get("index");
      response = new Response(index || "[]", { status: 200 });
    } else {
      // Fetch individual post
      const id = url.pathname.split("/").pop();
      const post = await BLOG_POSTS.get(id);
      response = new Response(post || "Not found", post ? { status: 200 } : { status: 404 });
    }
  } else if (request.method === "POST") {
    const { id, title, content } = await request.json();

    if (!id || !title || !content) {
      response = new Response("Missing fields in request body", { status: 400 });
    } else {
      await BLOG_POSTS.put(id, JSON.stringify({ title, content }));

      // Add post ID to index
      const index = JSON.parse(await BLOG_POSTS.get("index") || "[]");
      if (!index.includes(id)) {
        index.push(id);
        await BLOG_POSTS.put("index", JSON.stringify(index));
      }

      response = new Response("Post created successfully", { status: 201 });
    }
  } else {
    response = new Response("Method not allowed", { status: 405 });
  }

  // Set CORS headers
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");

  return response;
}
