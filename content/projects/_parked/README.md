Entries parked out of the archive.

`lib/writing/collection.ts` only reads `.md` files at the top level of
`content/archive`, so anything in this folder is invisible to the site while
staying in the repo. To bring one back, move it up one level and give it a
`rank`. Their cover images are still in `public/archive/`.
