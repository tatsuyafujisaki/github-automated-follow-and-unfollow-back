import { Octokit } from "octokit";

const octokit = new Octokit({ auth: Deno.env.get("GITHUB_TOKEN") });

async function main() {
  try {
    const [{ data: user }, followersList, followingList] = await Promise.all([
      octokit.rest.users.getAuthenticated(),
      // https://docs.github.com/en/rest/users/followers#list-followers-of-the-authenticated-user
      octokit.paginate("GET /user/followers", { per_page: 100 }),
      // https://docs.github.com/en/rest/users/followers#list-the-people-the-authenticated-user-follows
      octokit.paginate("GET /user/following", { per_page: 100 }),
    ]);

    console.log(`Authenticated as: ${user.login}`);

    const followers = new Set((followersList as { login: string }[]).map((u) => u.login));
    const following = new Set((followingList as { login: string }[]).map((u) => u.login));

    console.log(`Found ${followers.size} followers and ${following.size} following.`);

    for (const follower of [...followers].filter((f) => !following.has(f))) {
      const response = await octokit.rest.users.follow({ username: follower });
      if (response.status >= 200 && response.status < 300) {
        console.log(`Followed ${follower} unless the user's profile was private.`);
      }
    }

    for (const followedUser of [...following].filter((f) => !followers.has(f))) {
      const response = await octokit.rest.users.unfollow({ username: followedUser });
      if (response.status >= 200 && response.status < 300) {
        console.log(`Unfollowed ${followedUser} unless the user's profile was private.`);
      }
    }
  } catch (error) {
    console.error(error);
    Deno.exit(1);
  }
}

await main();

Deno.exit(0);
