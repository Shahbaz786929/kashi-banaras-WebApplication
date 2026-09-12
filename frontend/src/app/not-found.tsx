import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "60px 20px",
      }}
    >
      <div>
        <span className="eyebrow">
          KASHI BANARAS
        </span>

        <h1
          style={{
            fontSize: "48px",
            margin: "15px 0",
          }}
        >
          Product Not Found
        </h1>

        <p
          style={{
            marginBottom: "30px",
            opacity: 0.7,
          }}
        >
          The saree you are looking for
          could not be found.
        </p>

        <Link
          href="/sarees"
          className="gold-btn"
        >
          VIEW ALL SAREES
        </Link>
      </div>
    </main>
  );
}