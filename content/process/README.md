# Content process

How entries get from idea to the live site. See also `../README.md` (entry format)
and `../schema/entry.schema.json`.

1. **Draft.** One drafting session per entry follows `drafting-brief.md`. It writes
   the entry, its photo and the `drafted` and `source-checked` review stages.
2. **Verify, round 1.** A separate session with fresh context follows
   `verifier-brief.md` and tries to disprove every sentence using only the cited
   sources. It reads a copy with the review notes stripped, made with
   `scripts/make-verifier-copy.py <entry.md> <copy.md>`.
3. **Fix**, then **verify, round 2** with the same verifier on a new copy.
4. Add the `second-pass` stage (by `Claude (separate verifier session)`) with a note
   on what the rounds found, and open one PR per batch (about 10 entries) with the
   batch's verification log in the description.
5. **Eric reviews.** On approval, add the `approved` stage (by `Eric`). Hard-history
   entries note whether outside review happened. Merge; the site deploys.

Verifier logs live in each batch's PR description.
