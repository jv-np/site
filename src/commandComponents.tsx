import type { ReactNode } from 'react';
import { Suspense, useEffect, useState } from 'react';
import { projects } from './data';
import { Out, RunChip } from './ui';
import type { CommandCtx } from './commandTypes';

type Project = (typeof projects)[number];

export function Panel(props: { title: string; meta?: string; children: ReactNode }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <span className="name">
          <span className="ac">▎</span> {props.title}
        </span>
        {props.meta && <span className="meta">· {props.meta}</span>}
        <span className="rule" />
      </div>
      {props.children}
    </div>
  );
}

export function Showcase() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const expanded = expandedId
    ? projects.find((project) => project.id === expandedId) ?? null
    : null;

  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpandedId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

  return (
    <div className={`showcase-frame${expanded ? ' showcase-frame-modal' : ''}`}>
      <div className="grid">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onExpand={() => setExpandedId(project.id)}
          />
        ))}
      </div>
      {expanded ? (
        <ExpandedCard project={expanded} onClose={() => setExpandedId(null)} />
      ) : null}
    </div>
  );
}

function ProjectCard({ project, onExpand }: { project: Project; onExpand: () => void }) {
  const expandable = Boolean(project.expandable);

  if (!expandable) {
    return (
      <a
        href={project.url}
        target={project.url.startsWith('http') ? '_blank' : undefined}
        rel="noopener noreferrer"
        className="card"
        draggable={false}
      >
        <CardBody project={project} />
      </a>
    );
  }

  return (
    <div
      className="card card-expandable"
      role="button"
      tabIndex={0}
      onClick={onExpand}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onExpand();
        }
      }}
    >
      <CardCorners />
      <CardBody project={project} expandable />
    </div>
  );
}

function CardCorners() {
  const corners = ['tl', 'tr', 'bl', 'br'] as const;

  return (
    <>
      {corners.map((corner) => (
        <span key={corner} className={`card-corner card-corner-${corner}`} aria-hidden />
      ))}
    </>
  );
}

function CardBody({
  project,
  expandable,
  inModal,
}: {
  project: Project;
  expandable?: boolean;
  inModal?: boolean;
}) {
  const external = project.url.startsWith('http');
  return (
    <>
      <div className="card-head">
        <span className="card-id mono">PRJ-{project.id} · {project.year}</span>
        {expandable && !inModal ? (
          <a
            className="card-link mono"
            href={project.url}
            target={external ? '_blank' : undefined}
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            title="open project (skip preview)"
            aria-label="open project"
            draggable={false}
          >↗</a>
        ) : (
          <span className="arrow mono">↗</span>
        )}
      </div>
      <div className="card-title">{project.name}</div>
      <p className="card-desc">{project.description}</p>
      {project.component ? (
        <div
          className="card-embed"
          onClickCapture={(event) => event.preventDefault()}
          onDragStart={(event) => event.preventDefault()}
        >
          <Suspense fallback={<p className="card-desc">loading project...</p>}>
            <project.component />
          </Suspense>
        </div>
      ) : null}
      <ul className="tags">
        {project.tags.map((tag) => <li key={tag} className="tag">{tag}</li>)}
      </ul>
    </>
  );
}

function ExpandedCard({ project, onClose }: { project: Project; onClose: () => void }) {
  const external = project.url.startsWith('http');
  return (
    <>
      <div
        className="card-backdrop"
        onClick={onClose}
        aria-hidden
      />
      <a
        href={project.url}
        target={external ? '_blank' : undefined}
        rel="noopener noreferrer"
        className="card card-expanded card-modal"
        aria-label={`open ${project.name}`}
        draggable={false}
      >
        <div className="card-modal-controls">
          <button
            type="button"
            className="card-close mono"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onClose();
            }}
            aria-label="close (esc)"
            title="close (esc)"
          >×</button>
        </div>
        <CardBody project={project} expandable inModal />
      </a>
    </>
  );
}

/* interactive tips reference site features and need ctx for clickable chips. */
const INTERACTIVE_TIPS: Array<(ctx: CommandCtx) => ReactNode> = [
  () => <>press <span className="hl">tab</span> to autocomplete · <span className="hl">↑/↓</span> walks history.</>,
  (ctx) => <>try <RunChip ctx={ctx} cmd="ls">ls</RunChip> to see sections, or <RunChip ctx={ctx} cmd="ls all">ls all</RunChip> for everything.</>,
  () => <>define your own shortcut: <span className="mono ac">alias g=showcase</span> — it persists across reloads.</>,
  () => <>every clickable <span className="mono">chip</span> below the prompt just types-and-runs a command. nothing magic.</>,
  (ctx) => <>articles support fuzzy match: <RunChip ctx={ctx} cmd="article macro">article macro</RunChip> opens by fragment.</>,
  (ctx) => <>filter writing by tag: <RunChip ctx={ctx} cmd="articles devex">articles devex</RunChip>.</>,
  (ctx) => <>this whole site is a terminal. <RunChip ctx={ctx} cmd="help">help</RunChip> lists everything.</>,
  (ctx) => <>bored? <RunChip ctx={ctx} cmd="showcase">showcase</RunChip> has a few things worth poking at.</>,
  (ctx) => <>your aliases survive reloads — see them with <RunChip ctx={ctx} cmd="alias">alias</RunChip>.</>,
  (ctx) => <>blank slate? hit <RunChip ctx={ctx} cmd="clear">clear</RunChip> and breathe.</>,
];

/* plain text tips — opinions, dev wisdom, asides. lowercase on purpose. */
const PLAIN_TIPS: string[] = [
  // — code & design —
  "good code reads like prose. if a function needs a comment to explain *what*, rename it.",
  "premature abstraction costs more than duplication. wait for the third occurrence.",
  "the best dx is the one you don't notice — until you try a worse one.",
  "small, focused tools beat one giant framework. compose, don't inherit.",
  "if you can't explain it on a napkin, the design isn't done yet.",
  "your future self is the most underestimated user of your code.",
  "naming is 80% of design. the other 20% is also naming.",
  "delete code. it's the most underrated refactor.",
  "every line of code is a liability. write fewer of them.",
  "the cheapest feature is the one you don't ship.",
  "a good name makes a comment unnecessary. a great name makes the code obvious.",
  "consistency beats cleverness. boring code ages well.",
  "code is read 100x more than it's written. optimize for the reader.",
  "if a class has 'manager' or 'helper' in its name, it's probably doing too much.",
  "interfaces should be discovered, not designed up front.",
  "the wrong abstraction is more expensive than no abstraction.",
  "duplication is far cheaper than the wrong abstraction.",
  "make the change easy, then make the easy change.",
  "if it's hard to test, the design is wrong, not the test.",
  "convention beats configuration. configuration beats convention beats nothing.",
  "you don't need a design pattern. you need a clearer model.",
  "every flag you add is a branch you owe a test.",
  "boolean parameters are a smell. enums tell a story.",
  "magic numbers grow up to be magic bugs.",
  "the standard library is almost always enough.",
  "your dependency is someone else's deprecation.",
  "every dependency is a future migration.",
  "lock your versions. surprise upgrades surprise nobody pleasantly.",
  "shallow modules with deep interfaces are a trap. invert it.",
  "encapsulate complexity, don't spread it thin.",

  // — debugging —
  "the bug is always in the place you swore couldn't have bugs.",
  "rubber-duck before stack-overflow. you'll solve half of them yourself.",
  "if you can't reproduce it, you haven't understood it.",
  "log first, debug second. logs survive restarts; gdb sessions don't.",
  "git bisect is faster than your intuition. trust the binary search.",
  "the first hypothesis is rarely right. the third one usually is.",
  "when stuck, simplify until it works. then add back until it breaks.",
  "binary search the diff. binary search the input. binary search everything.",
  "a flaky test is a real bug wearing a costume.",
  "when in doubt, print it out.",
  "the bug is in the layer below the one you're staring at.",
  "if it works on your machine, ship your machine.",
  "always check the easy thing first. is it plugged in?",
  "errors lie. stack traces don't.",
  "the bug isn't where it crashes. it's where the assumption broke.",
  "reproduce, reduce, repair. in that order.",
  "every 'impossible' bug is a hidden assumption.",
  "when the test passes locally and fails in CI, suspect time, locale, or order.",

  // — testing —
  "tests aren't proof of correctness. they're proof you cared.",
  "a test that mocks everything tests nothing.",
  "test behavior, not implementation. you'll thank yourself in six months.",
  "if your test setup is longer than the test, the design is screaming.",
  "fast tests get run. slow tests get skipped.",
  "the best assertion is the one that fails for one reason only.",
  "snapshot tests are screenshots of your indecision.",
  "coverage is a tool, not a goal. 100% coverage of bad tests is still bad.",
  "write the test that would have caught the bug. now write the fix.",
  "an integration test is worth a hundred unit tests when you ship.",

  // — performance —
  "profile before you optimize. intuition is wrong about performance, always.",
  "the fastest code is the code that doesn't run.",
  "cache invalidation is the second hardest problem. the first is naming.",
  "n+1 queries are the silent killer of every web app.",
  "io dominates. cpu rarely matters until io is fixed.",
  "allocations are slower than you think. measure them.",
  "the optimization you didn't ship has zero risk.",
  "make it work. make it right. make it fast — only if you must.",
  "indexes aren't free. but missing indexes are catastrophic.",
  "batch your io. round trips compound.",

  // — terminal & tools —
  "learn one editor deeply. switching editors is mostly a tax.",
  "your shell history is a productivity goldmine. grep it.",
  "fzf changes how you navigate everything. install it once, use it forever.",
  "bind frequent commands to short aliases. then forget them on purpose.",
  "ripgrep is faster than grep. ripgrep is faster than your IDE search.",
  "git aliases are personal lubrication. there's no wrong one.",
  "tmux survives the ssh disconnect. you don't.",
  "use jq for json. xargs for parallelism. parallel for the rest.",
  "learn the unix philosophy by writing one tool that does one thing well.",
  "your dotfiles are who you are. version them.",

  // — git & collaboration —
  "small commits, clear messages. your reviewers are humans.",
  "commit early, commit often. force-push later, intentionally.",
  "rebase your branch. merge into main. that's the rhythm.",
  "a commit message that says 'fix' fixes nothing.",
  "write commit messages for the person bisecting at 2am. that person is you.",
  "branch names are documentation. 'feature-1' is documentation of nothing.",
  "review your own diff before asking someone else to.",
  "a pr that touches everything reviews like nothing got reviewed.",
  "leave the code better than you found it. the boy scout rule still wins.",
  "a tag is a promise. break it carefully.",

  // — types & languages —
  "types are propositions. let the compiler prove them.",
  "make illegal states unrepresentable. then you don't need to handle them.",
  "if you have to write 'any', you've given up. own that or refactor.",
  "parse, don't validate. once it's a domain type, trust it.",
  "static types are documentation that can't go stale.",
  "the result type is better than exceptions for things you expect to fail.",
  "exceptions are for the impossible. errors are for the inevitable.",
  "narrow types accept everything. wide types accept nothing useful.",
  "if your type signature needs a paragraph, the type is wrong.",
  "type inference is a gift. use it without apology.",

  // — async & concurrency —
  "shared mutable state is the root of all concurrency bugs.",
  "if you're synchronizing, you're probably designing wrong.",
  "channels over locks. messages over mutexes.",
  "async is a color. it spreads through your codebase. plan accordingly.",
  "every retry needs a backoff. every backoff needs a cap.",
  "every timeout needs a budget. every budget needs a fallback.",
  "idempotent operations forgive everything. design for them.",
  "deadlocks happen at the layer you forgot existed.",
  "race conditions are reproducible. you just need the right load.",
  "callbacks compose poorly. promises compose okay. async/await composes well.",

  // — security —
  "never roll your own crypto. never. yes, even that.",
  "don't trust user input. don't trust your own input either.",
  "store secrets in env vars or vaults. never in the repo.",
  "least privilege isn't a guideline. it's the default.",
  "log access. audit logs save lives, eventually.",
  "every public endpoint is a target. rate-limit it.",
  "sql injection still happens in 2026. parameterize.",
  "csrf tokens, not vibes.",
  "https is not a feature. it's table stakes.",
  "rotate credentials. especially the ones you 'definitely already rotated'.",

  // — refactoring —
  "refactor in green. never refactor while a test is red.",
  "rename first. extract second. move third.",
  "a refactor that changes behavior is a bug pretending to be a chore.",
  "the rewrite is almost never the answer. the targeted refactor usually is.",
  "if you can't refactor without fear, your test suite is the real bug.",
  "make the diff smaller. always smaller.",
  "extract a function the moment a comment becomes necessary.",
  "if it has more than three reasons to change, it has too many.",
  "every refactor should reduce surface area, not relocate it.",
  "the best refactor leaves no trace in behavior, only in clarity.",

  // — documentation & writing —
  "write the readme first. if you can't, the project isn't ready.",
  "documentation that lives next to code stays alive. wikis die.",
  "examples beat explanations. one snippet > three paragraphs.",
  "the best docs answer 'why'. the second best answer 'how'. 'what' is for code.",
  "if you write it for a beginner, you'll teach the expert too.",
  "tutorials are for first contact. references are for power users. don't mix them.",
  "every public api needs at least one example. preferably runnable.",
  "deprecate loudly. delete quietly. but always with a migration path.",
  "a changelog is a love letter to your users.",
  "don't document what the code says. document what it doesn't.",

  // — process & estimation —
  "estimates are wrong. ranges are honest. ranges with assumptions are gold.",
  "double your estimate. then double it again. now you're close.",
  "the work expands to fill the deadline. shrink the deadline.",
  "deadlines without slack are deadlines without quality.",
  "ship something every day. even if it's small.",
  "perfect is the enemy of shipped. shipped is the enemy of perfect. choose.",
  "a half-done feature serves no one. cut scope, not quality.",
  "say no by default. say yes after thinking.",
  "the second 90% of any project takes 90% of the time.",
  "scope creep starts as 'just one more thing'.",

  // — reviews —
  "review the design, not the diff. the diff just confirms the design.",
  "be kind. the author already knows half the problems.",
  "reviews are a conversation, not a verdict.",
  "approve quickly. block deliberately.",
  "ask questions before suggesting changes. you're probably missing context.",
  "nit-picks belong below the fold. design notes belong above it.",
  "leave at least one positive comment. it's not flattery, it's signal.",
  "if the diff is too big to review, it's too big to ship.",

  // — learning & career —
  "go deep on one thing. go wide on everything else.",
  "you learn more from one painful bug than ten green builds.",
  "read code you didn't write. especially code you don't understand.",
  "build something useless. it's how you discover what you actually like.",
  "side projects don't need to ship. they need to teach.",
  "the best engineers are great communicators. the rest catch up or stall.",
  "ask the dumb question. someone else has it too.",
  "you'll never feel ready. apply, write, ship anyway.",
  "credentials open doors. work keeps them open.",
  "your network is built one helpful answer at a time.",
  "the senior engineer's superpower is knowing what not to build.",
  "burnout is not a badge. it's a bill.",
  "rest is part of the work. the brain consolidates while you sleep.",
  "writing forces clarity. write more.",
  "teach what you just learned. the gap is where you'll find the questions.",
  "your tools should fade into the background. if they don't, change them.",
  "switch stacks every few years. it keeps the brain limber.",
  "the imposter feeling never fully leaves. it just gets quieter.",
  "compound interest applies to skills too. show up daily.",
  "if you're the smartest in the room, find another room.",

  // — product & ux —
  "users don't read. design accordingly.",
  "the empty state is the most important state. design it first.",
  "loading states aren't optional. nor are error states.",
  "default values are decisions. choose them carefully.",
  "every modal is a tax on flow. justify it.",
  "if you need a tutorial, you need a redesign.",
  "delightful microinteractions cost almost nothing and are remembered forever.",
  "respect the user's time. shave a click. shave a second. shave a doubt.",
  "the first impression is the only impression you control.",
  "consistency builds trust. surprises break it.",
  "form follows function — until function is solved. then form takes over.",
  "design systems are agreements, not constraints.",
  "if a button needs a tooltip, the label is wrong.",
  "the best ui is no ui. the second best is one screen.",
  "feedback within 100ms feels instant. above 1s feels broken. design between.",
  "accessibility isn't a feature. it's the floor.",

  // — taste & philosophy —
  "constraints breed creativity. unlimited budgets breed feature lists.",
  "taste is acquired by exposure. consume widely.",
  "opinions are cheap. defended opinions are valuable.",
  "strong opinions, loosely held. especially the loosely-held part.",
  "the simple solution requires the most thought.",
  "elegance is what's left after you delete what isn't necessary.",
  "if it feels heavy, it is heavy. trust the gut, then verify.",
  "minimalism isn't fewer features. it's no wasted ones.",
  "the void in design is as important as the marks. learn to use it.",
  "good taste is just having seen enough bad taste.",
  "the rules exist for a reason. break them with reason.",
  "don't argue style. agree once, automate it, move on.",
  "a strong default is worth a thousand options.",
  "the best api is the one you didn't have to look up.",
  "if it sparks joy on a tuesday at 3pm, it's good design.",
  "less is more, except when less is less. taste tells you which.",

  // — productivity & focus —
  "deep work happens in hours, not minutes. protect them ruthlessly.",
  "notifications are interruptions wearing badges. mute them.",
  "the inbox is someone else's todo list for you. read it on your terms.",
  "two things on the calendar means one thing didn't get done well.",
  "energy management beats time management.",
  "if a task is under two minutes, do it now. otherwise, schedule it.",
  "context switching is the most expensive operation in your day.",
  "the meeting that could have been an email — let it be one.",
  "say no to good things to say yes to great things.",
  "your worst day at peak focus beats your best day at scattered.",
  "the morning is for creation. the afternoon is for collaboration.",
  "don't optimize the system you should be replacing.",

  // — debugging life —
  "if you're stuck, walk. the brain solves problems while the legs move.",
  "sleep on it. literally. the answer often arrives at 7am.",
  "talk to someone outside the problem. they'll ask the question you forgot.",
  "shower thoughts are real. keep a notes app near the bathroom.",
  "frustration is a signal you're close. or that you need a break. usually both.",
  "the answer is rarely a new tool, exceptly when it is.",

  // — meta —
  "every tip is wrong sometimes. context is everything.",
  "advice from senior engineers is half wisdom, half scar tissue.",
  "best practices are someone else's defaults. earn your own.",
  "the framework that taught you also limited you. notice both.",
  "don't cargo-cult. understand, then adopt — or skip.",
  "every blog post is a snapshot of one person's monday.",
  "stack overflow is a starting point, not an endpoint.",
  "ai is a junior engineer with infinite patience. review its work like you'd review theirs.",
  "the best code review is the one you give yourself before submitting.",
  "if a tool feels magical, find out how it works. magic is just unfamiliarity.",

  // — playful / asides —
  "semicolons are vibes-based. fight me.",
  "tabs vs spaces is settled — by your formatter.",
  "vim users have feelings. emacs users have opinions. nano users have things to do.",
  "css is a programming language. fight nobody, accept it.",
  "regex is read-only. write tests, not comments.",
  "json has no comments and that is a war crime.",
  "yaml has too many ways to say nothing.",
  "toml is the boring one that just works. love the boring one.",
  "the m in npm stands for modules, but feels like mistakes.",
  "the s in https stands for 'security' and 'suffering when expired'.",
  "the cloud is just someone else's computer. with a bigger bill.",
  "every junior writes a config language eventually. it's a rite of passage.",
  "you don't need kubernetes. you really don't. okay maybe you do. probably not.",
  "microservices solve problems you don't have and create ones you didn't expect.",
  "monoliths are fine. they're more than fine. they're often correct.",
  "the framework war ends when you ship.",
  "javascript fatigue is permanent. acceptance is freedom.",
  "the best programming language is the one your team already knows.",
  "rewrite it in rust. or don't. but feel the urge.",
  "perl is alive. it's just very quiet about it.",
  "lisp programmers know something you don't. that something is parens.",
  "haskell will change how you think. whether you want it to or not.",
  "go is what happens when google designs for new hires. that's a compliment.",
  "typescript is javascript that grew up and got therapy.",
  "kotlin is java with the regret removed.",
  "swift is what objective-c wanted to be the whole time.",
  "the database is a state machine that survived your power outage. respect it.",
  "logs are a love letter from past-you to future-you. write them well.",
  "monitoring is what tells you something is wrong. observability tells you why.",
  "alerts that don't page wake nobody. alerts that always page wake everyone.",
  "the cron job will fail. plan for it.",
  "backup is half the job. restore is the other half. test both.",

  // — design closing thoughts —
  "the prompt is a ui. typing feels like power. preserve that feeling.",
  "monospace fonts have soul. use one.",
  "low contrast is a bug, not a style.",
  "dark mode isn't an afterthought. design both from the start.",
  "color is information. don't use it as decoration alone.",
  "icons need labels. always.",
  "spacing is the unsung hero of design. add more of it.",
  "alignment is free. lack of alignment is expensive.",
  "grids exist for a reason. break them deliberately.",
  "every animation should have a purpose. purposeless motion is noise.",
  "transitions under 200ms feel responsive. above 400ms feel slow.",
  "easing curves matter. linear is robotic. ease-out is human.",

  // — closing wisdoms —
  "ship it. iterate. ship it again.",
  "done is better than perfect. shipped is better than done.",
  "the only code that matters is the code in production.",
  "your users care about outcomes, not your architecture.",
  "every system you build is a system you'll have to maintain.",
  "be the engineer you needed when you started.",
  "kindness scales. cleverness doesn't.",
  "the long game always wins. show up tomorrow.",
  "build what you'd want to use. then make it for everyone else.",
  "you don't have to know everything. you just have to know how to find out.",
  "stay curious. the rest follows.",
  "have fun. if you're not, change something.",
];

const TIPS: Array<(ctx: CommandCtx) => ReactNode> = [
  ...INTERACTIVE_TIPS,
  ...PLAIN_TIPS.map((s) => () => <>{s}</>),
];

export function TipBody({ ctx }: { ctx: CommandCtx }) {
  const [pick] = useState(() => {
    const last = Number(sessionStorage.getItem('tips:last') ?? '-1');
    let index = Math.floor(Math.random() * TIPS.length);
    if (TIPS.length > 1 && index === last) index = (index + 1) % TIPS.length;
    sessionStorage.setItem('tips:last', String(index));
    return index;
  });
  const tip = TIPS[pick];
  return (
    <Panel title="tip" meta={`#${String(pick + 1).padStart(2, '0')}/${String(TIPS.length).padStart(2, '0')}`}>
      <Out>
        <span className="ac mono">»</span> {tip(ctx)}
      </Out>
      <Out style={{ marginTop: 8 }}>
        <span className="dim">run </span><RunChip ctx={ctx} cmd="tips">tips</RunChip><span className="dim"> again for another.</span>
      </Out>
    </Panel>
  );
}