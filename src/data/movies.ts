export interface Movie {
  id: number;
  title: string;
  year: number;
  rating: number;
  genre: string[];
  duration: string;
  description: string;
  poster: string;
  backdrop: string;
  director: string;
  cast: string[];
}

const POSTER_BASE = "https://image.tmdb.org/t/p/w500";
const BACKDROP_BASE = "https://image.tmdb.org/t/p/original";

export const movies: Movie[] = [
  {
    id: 1,
    title: "Dune: Part Two",
    year: 2024,
    rating: 8.5,
    genre: ["Sci-Fi", "Adventure", "Drama"],
    duration: "2h 46m",
    description: "Paul Atreides unites with the Fremen while on a warpath of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future.",
    poster: `${POSTER_BASE}/8b8R8l88Qje9dn9OE8PY05Nez7.jpg`,
    backdrop: `${BACKDROP_BASE}/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg`,
    director: "Denis Villeneuve",
    cast: ["Timothée Chalamet", "Zendaya", "Austin Butler", "Florence Pugh"],
  },
  {
    id: 2,
    title: "Oppenheimer",
    year: 2023,
    rating: 8.4,
    genre: ["Drama", "History", "Biography"],
    duration: "3h 0m",
    description: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.",
    poster: `${POSTER_BASE}/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg`,
    backdrop: `${BACKDROP_BASE}/nb3xI8XI3w4pMVZ38VijbsyBqP4.jpg`,
    director: "Christopher Nolan",
    cast: ["Cillian Murphy", "Emily Blunt", "Matt Damon", "Robert Downey Jr."],
  },
  {
    id: 3,
    title: "The Batman",
    year: 2022,
    rating: 7.8,
    genre: ["Action", "Crime", "Drama"],
    duration: "2h 56m",
    description: "When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city's hidden corruption and question his family's involvement.",
    poster: `${POSTER_BASE}/74xTEgt7R36Fpooo50r9T25onhq.jpg`,
    backdrop: `${BACKDROP_BASE}/b0PlSFdDwbyFAJlMe1mDbqSwans.jpg`,
    director: "Matt Reeves",
    cast: ["Robert Pattinson", "Zoë Kravitz", "Paul Dano", "Colin Farrell"],
  },
  {
    id: 4,
    title: "Everything Everywhere All at Once",
    year: 2022,
    rating: 7.8,
    genre: ["Action", "Adventure", "Comedy"],
    duration: "2h 19m",
    description: "A middle-aged Chinese immigrant is swept up into an insane adventure in which she alone can save existence by exploring other universes and connecting with the lives she could have led.",
    poster: `${POSTER_BASE}/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg`,
    backdrop: `${BACKDROP_BASE}/fOy2Jurz9k6RnJnMUMRDAgBwru2.jpg`,
    director: "Daniel Kwan, Daniel Scheinert",
    cast: ["Michelle Yeoh", "Stephanie Hsu", "Ke Huy Quan", "Jamie Lee Curtis"],
  },
  {
    id: 5,
    title: "Interstellar",
    year: 2014,
    rating: 8.7,
    genre: ["Sci-Fi", "Adventure", "Drama"],
    duration: "2h 49m",
    description: "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot is tasked to pilot a spacecraft along with a team of researchers to find a new planet for humans.",
    poster: `${POSTER_BASE}/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg`,
    backdrop: `${BACKDROP_BASE}/xJHokMbljvjADYdit5fK1B4Q2Nk.jpg`,
    director: "Christopher Nolan",
    cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain", "Michael Caine"],
  },
  {
    id: 6,
    title: "Blade Runner 2049",
    year: 2017,
    rating: 8.0,
    genre: ["Sci-Fi", "Drama", "Mystery"],
    duration: "2h 44m",
    description: "Young Blade Runner K's discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard, who's been missing for thirty years.",
    poster: `${POSTER_BASE}/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg`,
    backdrop: `${BACKDROP_BASE}/sAtoMqDVhNDQBc3QJL3RF6hlhGq.jpg`,
    director: "Denis Villeneuve",
    cast: ["Ryan Gosling", "Harrison Ford", "Ana de Armas", "Jared Leto"],
  },
  {
    id: 7,
    title: "Parasite",
    year: 2019,
    rating: 8.5,
    genre: ["Drama", "Thriller", "Comedy"],
    duration: "2h 12m",
    description: "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
    poster: `${POSTER_BASE}/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg`,
    backdrop: `${BACKDROP_BASE}/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg`,
    director: "Bong Joon-ho",
    cast: ["Song Kang-ho", "Lee Sun-kyun", "Cho Yeo-jeong", "Choi Woo-shik"],
  },
  {
    id: 8,
    title: "Mad Max: Fury Road",
    year: 2015,
    rating: 8.1,
    genre: ["Action", "Adventure", "Sci-Fi"],
    duration: "2h 0m",
    description: "In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland with the aid of a group of female prisoners, a psychotic worshiper, and a drifter named Max.",
    poster: `${POSTER_BASE}/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg`,
    backdrop: `${BACKDROP_BASE}/nlCHUWjY9XWbuEUQauCBgnY8ymF.jpg`,
    director: "George Miller",
    cast: ["Tom Hardy", "Charlize Theron", "Nicholas Hoult", "Hugh Keays-Byrne"],
  },
  {
    id: 9,
    title: "The Grand Budapest Hotel",
    year: 2014,
    rating: 8.1,
    genre: ["Adventure", "Comedy", "Crime"],
    duration: "1h 39m",
    description: "A writer encounters the owner of an aging high-class hotel, who tells him of his early years serving as a lobby boy in the hotel's glorious years under an exceptional concierge.",
    poster: `${POSTER_BASE}/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg`,
    backdrop: `${BACKDROP_BASE}/nX5XotM9yprCKarRH4fzOq1VM1J.jpg`,
    director: "Wes Anderson",
    cast: ["Ralph Fiennes", "F. Murray Abraham", "Mathieu Amalric", "Tony Revolori"],
  },
  {
    id: 10,
    title: "Arrival",
    year: 2016,
    rating: 7.9,
    genre: ["Drama", "Mystery", "Sci-Fi"],
    duration: "1h 56m",
    description: "A linguist works with the military to communicate with alien lifeforms after twelve mysterious spacecraft appear around the world.",
    poster: `${POSTER_BASE}/x2FJsf1ElAgr63Y3LU4txRR7pgQ.jpg`,
    backdrop: `${BACKDROP_BASE}/yIZ1xendyqKvY3FGeeUYYp31things.jpg`,
    director: "Denis Villeneuve",
    cast: ["Amy Adams", "Jeremy Renner", "Forest Whitaker", "Michael Stuhlbarg"],
  },
];

export const genres = ["All", "Sci-Fi", "Drama", "Action", "Comedy", "Thriller", "Adventure", "Crime", "Mystery", "History", "Biography"];

export const getFeaturedMovies = () => movies.slice(0, 4);
export const getMovieById = (id: number) => movies.find((m) => m.id === id);
export const getMoviesByGenre = (genre: string) =>
  genre === "All" ? movies : movies.filter((m) => m.genre.includes(genre));
