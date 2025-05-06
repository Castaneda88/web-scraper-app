import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInWithPopup, GoogleAuthProvider, getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleScrape = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Data successfully scraped and exported to your Google Sheet.");
      } else {
        setMessage(data.error || "An error occurred.");
      }
    } catch (err) {
      setMessage("❌ Failed to scrape. Please try again.");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-6">Smart Product Scraper</h1>
      {!user ? (
        <Button onClick={handleLogin}>Sign in with Google</Button>
      ) : (
        <>
          <p className="mb-4">Welcome, {user.displayName}</p>
          <div className="w-full max-w-xl space-y-4">
            <Input
              type="text"
              placeholder="Paste product page URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full"
            />
            <Button onClick={handleScrape} disabled={loading || !url} className="w-full">
              {loading ? "Scraping..." : "Go"}
            </Button>
            {message && <p className="mt-4 text-center text-sm text-muted-foreground">{message}</p>}
            <Button onClick={handleLogout} variant="secondary" className="w-full mt-4">
              Sign Out
            </Button>
          </div>
        </>
      )}
    </main>
  );
}