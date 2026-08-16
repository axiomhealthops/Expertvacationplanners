export default function SignOutButton() {
  return (
    <form action="/logout" method="post">
      <button className="signout" type="submit">
        Sign out
      </button>
    </form>
  );
}
