/**
 * #4 Piggy Bank Factory: "Private savings with closures"
 *
 * ─── YOUR TURN ─────────────────────────────────────────────────────────
 * This one is yours to build. The component below is a placeholder so the
 * article still reads well until you replace it.
 *
 * The app: a "Create piggy bank" form (owner name + an emoji picker
 * 🐷🐘🦊). Each bank is a card with the owner and emoji, Deposit / Withdraw
 * buttons with an amount input (withdrawing too much says "Not enough
 * savings!" and changes nothing), the balance, and the last 5 transactions.
 * A "🔒 Try to hack it" button runs bank.balance = 1000000 and then shows
 * bank.balance (the hacker's NEW property) next to bank.getBalance() (the
 * real, unchanged balance). Several banks work independently: one backpack each.
 *
 * Suggested steps:
 *  1. Write the closure OUTSIDE React, in lib/createPiggyBank.ts:
 *
 *       export function createPiggyBank(owner: string) {
 *         let balance = 0;
 *         const history: string[] = [];
 *         return {
 *           owner,
 *           deposit(amount: number) { … },    // validate, update, push to history
 *           withdraw(amount: number) { … },   // return false if not enough
 *           getBalance() { return balance; },
 *           getHistory() { return [...history]; },  // a COPY, so nobody can edit it
 *         };
 *       }
 *
 *     Test it with Vitest FIRST: two banks keep separate balances,
 *     withdrawing too much returns false, getHistory() returns a copy.
 *  2. Keep the list of banks in useState (an array, from article #6).
 *  3. Here's the interesting part: after bank.deposit(…) the balance has
 *     changed, but React doesn't know! It only re-renders when STATE changes,
 *     and the closure's private `balance` isn't React state. So bump a
 *     `version` counter in state after each deposit/withdraw to redraw.
 *     (The more usual React way is to keep balances in state directly. Try
 *     both and notice the difference.)
 *  4. Render with banks.map(bank => <BankCard key={…} bank={bank} />).
 * Ping me when you have a first version and I'll review it.
 * ───────────────────────────────────────────────────────────────────────
 */

// Placeholder: replace this whole component with your piggy banks.
export default function PiggyBankFactory() {
  return (
    <div className="viz not-prose">
      <p className="viz-title">Piggy bank factory (coming soon)</p>
      <p className="viz-sub">
        Piggy banks with a truly private balance, built with closures, are on their way.
      </p>
      <p className="viz-caption">
        The idea: <code>balance</code> lives in the backpack of the functions the bank gives you.
        Nothing else can reach it.
      </p>
    </div>
  );
}
