/**
 * Vidush's personal reading list, sourced from his Goodreads "read" shelf.
 *
 * GENERATED FILE — do not hand-edit. Regenerate with:
 *   node scripts/fetch-goodreads-shelf.mjs
 *
 * Source feed: https://www.goodreads.com/review/list_rss/143317008?shelf=read
 * Generated:   2026-08-26T06:44:03.153Z
 */

export type PersonalBook = {
  id: string;
  title: string;
  author: string;
  /** Local path under /public — never hotlink Goodreads/Amazon CDN URLs. */
  coverPath: string;
  /** 1-5, omitted when unrated on Goodreads. */
  rating?: number;
  /** Goodreads review text, only present when non-empty. */
  review?: string;
  /** Date finished, as recorded on Goodreads (raw string, often absent). */
  readAt?: string;
  /** First-publication year, when Goodreads has it. */
  published?: string;
};

export const PERSONAL_READING_LIST: PersonalBook[] = [
  {
    id: "10746542",
    title: "The Sense of an Ending",
    author: "Julian Barnes",
    coverPath: "/about/books/the-sense-of-an-ending-10746542.jpg",
    rating: 4,
    published: "2011",
  },
  {
    id: "200776812",
    title: "Butter",
    author: "Asako Yuzuki",
    coverPath: "/about/books/butter-200776812.jpg",
    rating: 2,
    readAt: "Sat, 18 Jul 2026 00:00:00 +0000",
    published: "2017",
  },
  {
    id: "41733839",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    coverPath: "/about/books/the-great-gatsby-41733839.jpg",
    rating: 5,
    published: "1925",
  },
  {
    id: "54120408",
    title: "Klara and the Sun",
    author: "Kazuo Ishiguro",
    coverPath: "/about/books/klara-and-the-sun-54120408.jpg",
    rating: 3,
    published: "2021",
  },
  {
    id: "18144590",
    title: "The Alchemist",
    author: "Paulo Coelho",
    coverPath: "/about/books/the-alchemist-18144590.jpg",
    rating: 4,
    published: "1988",
  },
  {
    id: "56916837",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    coverPath: "/about/books/to-kill-a-mockingbird-56916837.jpg",
    rating: 5,
    readAt: "Sun, 19 Jul 2026 00:00:00 +0000",
    published: "1960",
  },
  {
    id: "218671839",
    title: "Strange Houses (Strange Houses, #1)",
    author: "Uketsu",
    coverPath: "/about/books/strange-houses-strange-houses-1-218671839.jpg",
    rating: 3,
    published: "2021",
  },
  {
    id: "18386",
    title: "The Death of Ivan Ilych",
    author: "Leo Tolstoy",
    coverPath: "/about/books/the-death-of-ivan-ilych-18386.jpg",
    rating: 3,
    readAt: "Thu, 2 Jul 2026 00:00:00 +0000",
    published: "1886",
  },
  {
    id: "170448",
    title: "Animal Farm",
    author: "George Orwell",
    coverPath: "/about/books/animal-farm-170448.jpg",
    rating: 4,
    published: "1945",
  },
  {
    id: "61439040",
    title: "1984",
    author: "George Orwell",
    coverPath: "/about/books/1984-61439040.jpg",
    rating: 5,
    published: "1949",
  },
  {
    id: "11297",
    title: "Norwegian Wood",
    author: "Haruki Murakami",
    coverPath: "/about/books/norwegian-wood-11297.jpg",
    rating: 4,
    readAt: "Mon, 6 Jul 2026 00:00:00 +0000",
    published: "1987",
  },
  {
    id: "4406",
    title: "East of Eden",
    author: "John Steinbeck",
    coverPath: "/about/books/east-of-eden-4406.jpg",
    rating: 5,
    readAt: "Mon, 13 Jul 2026 00:00:00 +0000",
    published: "1952",
  },
  {
    id: "1462282",
    title: "Bobok",
    author: "Fyodor Dostoevsky",
    coverPath: "/about/books/bobok-1462282.jpg",
    rating: 2,
    published: "1873",
  },
  {
    id: "1772910",
    title: "White Nights",
    author: "Fyodor Dostoevsky",
    coverPath: "/about/books/white-nights-1772910.jpg",
    rating: 4,
    published: "1848",
  },
  {
    id: "29044",
    title: "The Secret History",
    author: "Donna Tartt",
    coverPath: "/about/books/the-secret-history-29044.jpg",
    rating: 4,
    published: "1992",
  },
  {
    id: "890",
    title: "Of Mice and Men",
    author: "John Steinbeck",
    coverPath: "/about/books/of-mice-and-men-890.jpg",
    rating: 5,
    readAt: "Fri, 3 Jul 2026 00:00:00 +0000",
    published: "1937",
  },
  {
    id: "49552",
    title: "The Stranger",
    author: "Albert Camus",
    coverPath: "/about/books/the-stranger-49552.jpg",
    rating: 4,
    published: "1942",
  },
  {
    id: "61111246",
    title: "Victory City",
    author: "Salman Rushdie",
    coverPath: "/about/books/victory-city-61111246.jpg",
    rating: 3,
    published: "2023",
  },
  {
    id: "485894",
    title: "The Metamorphosis",
    author: "Franz Kafka",
    coverPath: "/about/books/the-metamorphosis-485894.jpg",
    rating: 3,
    published: "1915",
  },
  {
    id: "49455",
    title: "Notes from Underground",
    author: "Fyodor Dostoevsky",
    coverPath: "/about/books/notes-from-underground-49455.jpg",
    rating: 4,
    published: "1864",
  },
  {
    id: "5107",
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    coverPath: "/about/books/the-catcher-in-the-rye-5107.jpg",
    rating: 4,
    published: "1951",
  },
];
