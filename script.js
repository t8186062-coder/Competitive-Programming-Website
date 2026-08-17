const HANDLES = {
  codeforces: "NomNomFull",
  atcoder: "NomNomCode",
  leetcode: "NomNomCode"
};

const CSES_SOLVED_COUNT = 53;
const CSES_TOTAL_COUNT = 400;

const FALLBACK_TOTALS = {
  codeforces: 12000,
  atcoder: 8000,
  leetcode: 3900
};

const state = {
  codeforcesSolved: 0,
  atcoderSolved: 0,
  csesSolved: CSES_SOLVED_COUNT,
  leetcodeSolved: 0,
  codeforcesTotal: FALLBACK_TOTALS.codeforces,
  atcoderTotal: FALLBACK_TOTALS.atcoder,
  leetcodeTotal: FALLBACK_TOTALS.leetcode,
  problems: [],
  statuses: []
};

const elements = {
  totalSolved: document.querySelector("#totalSolved"),
  codeforcesSolved: document.querySelector("#codeforcesSolved"),
  atcoderSolved: document.querySelector("#atcoderSolved"),
  csesSolved: document.querySelector("#csesSolved"),
  leetcodeSolved: document.querySelector("#leetcodeSolved"),
  codeforcesRating: document.querySelector("#codeforcesRating"),
  atcoderRating: document.querySelector("#atcoderRating"),
  leetcodeRating: document.querySelector("#leetcodeRating"),
  codeforcesContests: document.querySelector("#codeforcesContests"),
  atcoderContests: document.querySelector("#atcoderContests"),
  leetcodeContests: document.querySelector("#leetcodeContests"),
  leetcodeEasy: document.querySelector("#leetcodeEasy"),
  leetcodeMedium: document.querySelector("#leetcodeMedium"),
  leetcodeHard: document.querySelector("#leetcodeHard"),
  codeforcesDifficultyGrid: document.querySelector("#codeforcesDifficultyGrid"),
  atcoderDifficultyGrid: document.querySelector("#atcoderDifficultyGrid"),
  leetcodeDifficultyGrid: document.querySelector("#leetcodeDifficultyGrid"),
  profileCodeforcesRating: document.querySelector("#profileCodeforcesRating"),
  codeforcesRatingChart: document.querySelector("#codeforcesRatingChart"),
  leetcodeRatingChart: document.querySelector("#leetcodeRatingChart"),
  codeforcesRatingSummary: document.querySelector("#codeforcesRatingSummary"),
  leetcodeRatingSummary: document.querySelector("#leetcodeRatingSummary"),
  statusMessage: document.querySelector("#statusMessage"),
  problemList: document.querySelector("#problemList")
};

const codeforcesDifficultyBuckets = [
  { label: "Unrated", min: null, max: null, range: "No rating" },
  { label: "Newbie", min: 0, max: 1199, range: "< 1200" },
  { label: "Pupil", min: 1200, max: 1399, range: "1200-1399" },
  { label: "Specialist", min: 1400, max: 1599, range: "1400-1599" },
  { label: "Expert", min: 1600, max: 1899, range: "1600-1899" },
  { label: "Candidate Master", min: 1900, max: 2099, range: "1900-2099" },
  { label: "Master", min: 2100, max: 2299, range: "2100-2299" },
  { label: "International Master", min: 2300, max: 2399, range: "2300-2399" },
  { label: "Grandmaster", min: 2400, max: 2599, range: "2400-2599" },
  { label: "International Grandmaster", min: 2600, max: 2999, range: "2600-2999" },
  { label: "Legendary Grandmaster", min: 3000, max: Infinity, range: "3000+" }
];

const atcoderDifficultyBuckets = [
  { label: "Unrated", min: null, max: null, range: "No estimate" },
  { label: "Gray", min: 0, max: 399, range: "0-399" },
  { label: "Brown", min: 400, max: 799, range: "400-799" },
  { label: "Green", min: 800, max: 1199, range: "800-1199" },
  { label: "Cyan", min: 1200, max: 1599, range: "1200-1599" },
  { label: "Blue", min: 1600, max: 1999, range: "1600-1999" },
  { label: "Yellow", min: 2000, max: 2399, range: "2000-2399" },
  { label: "Orange", min: 2400, max: 2799, range: "2400-2799" },
  { label: "Red", min: 2800, max: Infinity, range: "2800+" }
];

const leetcodeDifficultyBuckets = [
  { label: "Easy", range: "Foundation" },
  { label: "Medium", range: "Core practice" },
  { label: "Hard", range: "Advanced" }
];

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function updateTotal() {
  elements.totalSolved.textContent = state.codeforcesSolved + state.atcoderSolved + state.csesSolved + state.leetcodeSolved;
}

function formatCount(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatSolvedTotal(solved, total, isEstimate = false) {
  const suffix = isEstimate ? "+" : "";
  return `${formatCount(solved)} / ${formatCount(total)}${suffix}`;
}

function addStatus(message) {
  state.statuses.push(message);
  elements.statusMessage.textContent = state.statuses.join(" ");
}

function findBucket(value, buckets) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return buckets[0].label;
  }

  const bucket = buckets.find((item) => (
    item.min !== null
    && value >= item.min
    && value <= item.max
  ));

  return bucket ? bucket.label : buckets[0].label;
}

function countDifficultyBuckets(problems, buckets, valueKey) {
  const counts = Object.fromEntries(buckets.map((bucket) => [bucket.label, 0]));

  problems.forEach((problem) => {
    const label = findBucket(problem[valueKey], buckets);
    counts[label] += 1;
  });

  return counts;
}

function renderDifficultyGrid(container, buckets, counts, cardClass = "") {
  container.innerHTML = buckets.map((bucket) => `
    <article class="platform-card ${cardClass}">
      <span>${bucket.label}</span>
      <strong>${counts[bucket.label] || 0}</strong>
      <small>${bucket.range}</small>
    </article>
  `).join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function renderRatingChart(container, summary, points, platform) {
  if (!points.length) {
    container.innerHTML = `<div class="chart-empty">${platform === "LeetCode" ? "Rating history is temporarily unavailable because the third-party API is rate-limited." : "No rated contests were returned."}</div>`;
    summary.innerHTML = "<span><small>Current</small><strong>—</strong></span><span><small>Peak</small><strong>—</strong></span>";
    return;
  }

  const width = 640;
  const height = 240;
  const pad = { top: 22, right: 18, bottom: 30, left: 48 };
  const values = points.map((point) => point.rating);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const spread = Math.max(100, rawMax - rawMin);
  const min = Math.floor((rawMin - spread * 0.12) / 100) * 100;
  const max = Math.ceil((rawMax + spread * 0.12) / 100) * 100;
  const x = (index) => pad.left + (points.length === 1 ? 0 : index / (points.length - 1)) * (width - pad.left - pad.right);
  const y = (rating) => pad.top + (max - rating) / Math.max(1, max - min) * (height - pad.top - pad.bottom);
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(point.rating).toFixed(1)}`).join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(1)},${height - pad.bottom} L${x(0).toFixed(1)},${height - pad.bottom} Z`;
  const ticks = Array.from({ length: 4 }, (_, index) => Math.round(max - index * (max - min) / 3));
  const gradientId = `rating-fill-${platform.toLowerCase()}`;
  const firstDate = new Date(points[0].timestamp * 1000).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const lastDate = new Date(points.at(-1).timestamp * 1000).toLocaleDateString("en-US", { month: "short", year: "numeric" });

  summary.innerHTML = `<span><small>Current</small><strong>${Math.round(points.at(-1).rating)}</strong></span><span><small>Peak</small><strong>${Math.round(rawMax)}</strong></span>`;
  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${platform} rating history over ${points.length} contests">
      <defs><linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".2"></stop><stop offset="1" stop-color="currentColor" stop-opacity="0"></stop></linearGradient></defs>
      ${ticks.map((tick) => `<g><line class="chart-gridline" x1="${pad.left}" x2="${width - pad.right}" y1="${y(tick)}" y2="${y(tick)}"></line><text class="chart-axis-label" x="${pad.left - 10}" y="${y(tick) + 4}" text-anchor="end">${tick}</text></g>`).join("")}
      <path d="${area}" fill="url(#${gradientId})"></path>
      <path class="chart-line" d="${line}"></path>
      ${points.map((point, index) => `<circle class="chart-point" cx="${x(index)}" cy="${y(point.rating)}" r="3.4"><title>${escapeHtml(point.label)}: ${Math.round(point.rating)}</title></circle>`).join("")}
      <text class="chart-date-label" x="${pad.left}" y="${height - 7}">${firstDate}</text>
      <text class="chart-date-label" x="${width - pad.right}" y="${height - 7}" text-anchor="end">${lastDate}</text>
    </svg>
  `;
}

function renderProblems() {
  const problems = state.problems
    .sort((a, b) => b.solvedAt - a.solvedAt)
    .slice(0, 30);

  if (!problems.length) {
    elements.problemList.innerHTML = "<p>No solved problems loaded yet.</p>";
    return;
  }

  elements.problemList.innerHTML = problems.map((problem) => `
    <a class="problem-card" data-platform="${problem.platform}" href="${problem.url}" target="_blank" rel="noreferrer">
      <span>
        <span class="platform-label">${problem.platform}</span>
        <strong>${problem.title}</strong>
        <span class="problem-meta">${problem.meta}</span>
      </span>
      <span class="problem-meta">Open</span>
    </a>
  `).join("");
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function fetchCodeforces(method, params) {
  const url = new URL(`https://codeforces.com/api/${method}`);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const data = await fetchJson(url);

  if (data.status !== "OK") {
    throw new Error(data.comment || "Codeforces API request failed.");
  }

  return data.result;
}

function getCodeforcesAcceptedProblems(submissions) {
  const accepted = new Map();

  submissions.forEach((submission) => {
    if (submission.verdict !== "OK" || !submission.problem) {
      return;
    }

    const problem = submission.problem;
    const key = `${problem.contestId}-${problem.index}`;

    if (!accepted.has(key)) {
      accepted.set(key, {
        title: `${problem.contestId}${problem.index}. ${problem.name}`,
        platform: "Codeforces",
        url: `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`,
        meta: `${problem.rating || "Unrated"} rating - ${(problem.tags || []).slice(0, 3).join(", ") || "No tags"}`,
        rating: problem.rating,
        solvedAt: submission.creationTimeSeconds
      });
    }
  });

  return [...accepted.values()];
}

async function loadCodeforces() {
  try {
    const users = await fetchCodeforces("user.info", { handles: HANDLES.codeforces });
    await wait(2200);

    const ratingHistory = await fetchCodeforces("user.rating", { handle: HANDLES.codeforces });
    await wait(2200);

    const submissions = await fetchCodeforces("user.status", { handle: HANDLES.codeforces });
    await wait(2200);

    const problemset = await fetchCodeforces("problemset.problems", {}).catch(() => null);
    const user = users[0];
    const acceptedProblems = getCodeforcesAcceptedProblems(submissions);
    const difficultyCounts = countDifficultyBuckets(acceptedProblems, codeforcesDifficultyBuckets, "rating");
    const totalProblems = problemset?.problems?.length || FALLBACK_TOTALS.codeforces;

    state.codeforcesSolved = acceptedProblems.length;
    state.codeforcesTotal = totalProblems;
    state.problems.push(...acceptedProblems);
    elements.codeforcesSolved.textContent = formatSolvedTotal(acceptedProblems.length, totalProblems, !problemset);
    elements.codeforcesRating.textContent = user.rating || "Unrated";
    elements.profileCodeforcesRating.textContent = user.rating || "Unrated";
    elements.codeforcesContests.textContent = ratingHistory.length;
    renderDifficultyGrid(elements.codeforcesDifficultyGrid, codeforcesDifficultyBuckets, difficultyCounts, "codeforces-card");
    renderRatingChart(
      elements.codeforcesRatingChart,
      elements.codeforcesRatingSummary,
      ratingHistory.map((contest) => ({
        rating: contest.newRating,
        timestamp: contest.ratingUpdateTimeSeconds,
        label: contest.contestName
      })).filter((point) => Number.isFinite(point.rating) && Number.isFinite(point.timestamp)),
      "Codeforces"
    );
    updateTotal();
    renderProblems();
    addStatus(`Codeforces loaded: ${acceptedProblems.length} solved.`);
  } catch (error) {
    elements.codeforcesSolved.textContent = formatSolvedTotal(state.codeforcesSolved, FALLBACK_TOTALS.codeforces, true);
    elements.codeforcesRating.textContent = "Error";
    elements.profileCodeforcesRating.textContent = "Unavailable";
    elements.codeforcesContests.textContent = "Error";
    elements.codeforcesDifficultyGrid.innerHTML = "<p>Codeforces difficulty failed to load.</p>";
    renderRatingChart(elements.codeforcesRatingChart, elements.codeforcesRatingSummary, [], "Codeforces");
    addStatus(`Codeforces failed: ${error.message}.`);
  }
}

function readAtCoderEstimatedDifficulty(problemId, problemModels) {
  const model = problemModels?.[problemId];
  const difficulty = model?.difficulty;

  if (difficulty === undefined || difficulty === null) {
    return null;
  }

  return Math.max(0, Math.round(difficulty));
}

function getAtCoderAcceptedProblems(submissions, problemModels) {
  const accepted = new Map();

  submissions.forEach((submission) => {
    if (submission.result !== "AC") {
      return;
    }

    if (!accepted.has(submission.problem_id)) {
      const estimatedDifficulty = readAtCoderEstimatedDifficulty(submission.problem_id, problemModels);
      const fallbackDifficulty = submission.point || null;

      accepted.set(submission.problem_id, {
        title: submission.problem_id,
        platform: "AtCoder",
        url: `https://atcoder.jp/contests/${submission.contest_id}/tasks/${submission.problem_id}`,
        meta: `${submission.language} - ${estimatedDifficulty ?? fallbackDifficulty ?? "Unrated"} difficulty`,
        difficulty: estimatedDifficulty ?? fallbackDifficulty,
        solvedAt: submission.epoch_second
      });
    }
  });

  return [...accepted.values()];
}

function readAtCoderContestCount(userInfo, submissions) {
  const directCount = userInfo.competitions
    ?? userInfo.rated_matches
    ?? userInfo.ratedMatches
    ?? userInfo.contest_count
    ?? userInfo.contestCount;

  if (directCount !== undefined && directCount !== null) {
    return directCount;
  }

  return new Set(submissions.map((submission) => submission.contest_id)).size;
}

async function loadAtCoder() {
  try {
    const userUrl = `https://kenkoooo.com/atcoder/atcoder-api/v3/user_info?user=${HANDLES.atcoder}`;
    const submissionsUrl = `https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${HANDLES.atcoder}&from_second=0`;
    const modelsUrl = "https://kenkoooo.com/atcoder/resources/problem-models.json";
    const mergedProblemsUrl = "https://kenkoooo.com/atcoder/resources/merged-problems.json";

    const [userInfo, submissions, problemModels, mergedProblems] = await Promise.all([
      fetchJson(userUrl),
      fetchJson(submissionsUrl),
      fetchJson(modelsUrl).catch(() => null),
      fetchJson(mergedProblemsUrl).catch(() => null)
    ]);

    const acceptedProblems = getAtCoderAcceptedProblems(submissions, problemModels);
    const difficultyCounts = countDifficultyBuckets(acceptedProblems, atcoderDifficultyBuckets, "difficulty");
    const totalProblems = mergedProblems?.length || FALLBACK_TOTALS.atcoder;

    state.atcoderSolved = acceptedProblems.length;
    state.atcoderTotal = totalProblems;
    state.problems.push(...acceptedProblems);
    elements.atcoderSolved.textContent = formatSolvedTotal(acceptedProblems.length, totalProblems, !mergedProblems);
    elements.atcoderRating.textContent = userInfo.rating || "Unrated";
    elements.atcoderContests.textContent = readAtCoderContestCount(userInfo, submissions);
    renderDifficultyGrid(elements.atcoderDifficultyGrid, atcoderDifficultyBuckets, difficultyCounts, "atcoder-card");
    updateTotal();
    renderProblems();
    addStatus(`AtCoder loaded: ${acceptedProblems.length} solved.`);
  } catch (error) {
    elements.atcoderSolved.textContent = formatSolvedTotal(state.atcoderSolved, FALLBACK_TOTALS.atcoder, true);
    elements.atcoderRating.textContent = "Error";
    elements.atcoderContests.textContent = "Error";
    elements.atcoderDifficultyGrid.innerHTML = "<p>AtCoder difficulty failed to load.</p>";
    addStatus(`AtCoder failed: ${error.message}.`);
  }
}

function readLeetCodeSolved(data) {
  return data.solvedProblem
    ?? data.totalSolved
    ?? data.solved
    ?? data.matchedUser?.submitStatsGlobal?.acSubmissionNum?.find((item) => item.difficulty === "All")?.count
    ?? 0;
}

function readLeetCodeDifficulty(data, key) {
  const directKeys = {
    easy: ["easySolved", "easy"],
    medium: ["mediumSolved", "medium"],
    hard: ["hardSolved", "hard"]
  };

  for (const field of directKeys[key]) {
    if (data[field] !== undefined) {
      return data[field];
    }
  }

  const label = key[0].toUpperCase() + key.slice(1);
  return data.matchedUser?.submitStatsGlobal?.acSubmissionNum?.find((item) => item.difficulty === label)?.count ?? 0;
}

function normalizeLeetCodeSubmissions(data) {
  const list = data.submission
    ?? data.submissions
    ?? data.acSubmission
    ?? data.acSubmissions
    ?? data.recentAcSubmissionList
    ?? data.recentSubmissionList
    ?? [];

  return list.map((submission) => {
    const titleSlug = submission.titleSlug || submission.slug;
    const title = submission.title || submission.questionTitle || titleSlug || "LeetCode problem";

    return {
      title,
      platform: "LeetCode",
      url: titleSlug ? `https://leetcode.com/problems/${titleSlug}/` : `https://leetcode.com/u/${HANDLES.leetcode}/`,
      meta: "Accepted submission",
      solvedAt: Number(submission.timestamp || submission.time || 0)
    };
  });
}

function readLeetCodeRating(data) {
  const rating = data.contestRating
    ?? data.userContestRanking?.rating
    ?? data.matchedUser?.contestBadge?.rating;

  return rating ? Math.round(rating) : "Unrated";
}

function readLeetCodeContestCount(data) {
  return data.contestAttend
    ?? data.attendedContestsCount
    ?? data.userContestRanking?.attendedContestsCount
    ?? data.contestParticipation?.filter((contest) => contest.attended).length
    ?? 0;
}

async function loadLeetCode() {
  try {
    const solvedUrl = `https://alfa-leetcode-api.onrender.com/${HANDLES.leetcode}/solved`;
    const recentUrl = `https://alfa-leetcode-api.onrender.com/${HANDLES.leetcode}/acSubmission?limit=20`;
    const contestUrl = `https://alfa-leetcode-api.onrender.com/${HANDLES.leetcode}/contest`;
    const problemsUrl = "https://alfa-leetcode-api.onrender.com/problems?limit=1";

    const [solvedData, recentData, contestData, problemsData] = await Promise.all([
      fetchJson(solvedUrl),
      fetchJson(recentUrl),
      fetchJson(contestUrl),
      fetchJson(problemsUrl).catch(() => null)
    ]);

    const solved = readLeetCodeSolved(solvedData);
    const easy = readLeetCodeDifficulty(solvedData, "easy");
    const medium = readLeetCodeDifficulty(solvedData, "medium");
    const hard = readLeetCodeDifficulty(solvedData, "hard");
    const recentProblems = normalizeLeetCodeSubmissions(recentData);
    const totalProblems = problemsData?.totalQuestions || FALLBACK_TOTALS.leetcode;

    state.leetcodeSolved = solved;
    state.leetcodeTotal = totalProblems;
    state.problems.push(...recentProblems);
    elements.leetcodeSolved.textContent = formatSolvedTotal(solved, totalProblems, !problemsData);
    elements.leetcodeRating.textContent = readLeetCodeRating(contestData);
    elements.leetcodeContests.textContent = readLeetCodeContestCount(contestData);
    elements.leetcodeEasy.textContent = easy;
    elements.leetcodeMedium.textContent = medium;
    elements.leetcodeHard.textContent = hard;
    renderDifficultyGrid(elements.leetcodeDifficultyGrid, leetcodeDifficultyBuckets, { Easy: easy, Medium: medium, Hard: hard }, "leetcode-card");
    renderRatingChart(
      elements.leetcodeRatingChart,
      elements.leetcodeRatingSummary,
      (contestData.contestParticipation || []).map((contest) => ({
        rating: contest.rating,
        timestamp: contest.contest?.startTime,
        label: contest.contest?.title || "LeetCode contest"
      })).filter((point) => Number.isFinite(point.rating) && Number.isFinite(point.timestamp)),
      "LeetCode"
    );
    updateTotal();
    renderProblems();
    addStatus(`LeetCode loaded: ${solved} solved.`);
  } catch (error) {
    elements.leetcodeSolved.textContent = formatSolvedTotal(state.leetcodeSolved, FALLBACK_TOTALS.leetcode, true);
    elements.leetcodeRating.textContent = "Error";
    elements.leetcodeContests.textContent = "Error";
    elements.leetcodeEasy.textContent = "Error";
    elements.leetcodeMedium.textContent = "Error";
    elements.leetcodeHard.textContent = "Error";
    elements.leetcodeDifficultyGrid.innerHTML = "<p>LeetCode difficulty failed to load.</p>";
    renderRatingChart(elements.leetcodeRatingChart, elements.leetcodeRatingSummary, [], "LeetCode");
    addStatus(`LeetCode failed: ${error.message}.`);
  }
}

function init() {
  elements.csesSolved.textContent = formatSolvedTotal(CSES_SOLVED_COUNT, CSES_TOTAL_COUNT);
  updateTotal();
  renderProblems();
  renderDifficultyGrid(elements.codeforcesDifficultyGrid, codeforcesDifficultyBuckets, {}, "codeforces-card");
  renderDifficultyGrid(elements.atcoderDifficultyGrid, atcoderDifficultyBuckets, {}, "atcoder-card");
  renderDifficultyGrid(elements.leetcodeDifficultyGrid, leetcodeDifficultyBuckets, {}, "leetcode-card");
  loadCodeforces();
  loadAtCoder();
  loadLeetCode();
}

init();
