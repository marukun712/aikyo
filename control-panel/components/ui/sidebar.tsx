import Link from "next/link";

export default function Sidebar() {
  return (
    <nav className="left">
      <Link href="/">
        <i>home</i>
        <div>Rooms</div>
      </Link>
      <Link href="/companions">
        <i>account_circle</i>
        <div>Companions</div>
      </Link>
      <Link href="/furniture">
        <i>chair</i>
        <div>Furniture</div>
      </Link>
    </nav>
  );
}
