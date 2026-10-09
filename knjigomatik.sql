--
-- PostgreSQL database dump
--

\restrict S83xeAs2BMuiDeMXcjR4WBqqhh1nxRYdJklwXaxhfHxehsDKof8di3oEaAgBoP8

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: book_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.book_status AS ENUM (
    'wishlist',
    'reading',
    'read',
    'reserved',
    'unavailable',
    'cancelled'
);


ALTER TYPE public.book_status OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: books; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.books (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(500) NOT NULL,
    author character varying(500) NOT NULL,
    status public.book_status DEFAULT 'wishlist'::public.book_status NOT NULL,
    rating integer,
    color character varying(7) DEFAULT '#ffffff'::character varying NOT NULL,
    summary text,
    genre character varying(100),
    year integer,
    thumbnail text,
    description text,
    isbn character varying(20),
    page_count integer,
    publisher character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT books_rating_check CHECK (((rating >= 1) AND (rating <= 10)))
);


ALTER TABLE public.books OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username character varying(100) NOT NULL,
    display_name character varying(255) NOT NULL,
    password_hash text NOT NULL,
    is_admin boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: books; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.books (id, user_id, title, author, status, rating, color, summary, genre, year, thumbnail, description, isbn, page_count, publisher, created_at, updated_at) FROM stdin;
ed543b5c-cdef-4614-8564-4f5ab5e83aab	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Brez nje	Lisa Jewell	wishlist	\N	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/74519043	\N	\N	\N	\N	2026-08-19 07:01:58.950442	2026-08-19 07:01:58.950442
c3f45729-370a-4ee4-abb7-4a30e8fc3460	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Tiha pacientka	Alex Michaelides	read	10	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/298833152	\N	\N	\N	\N	2026-08-19 07:03:19.985673	2026-08-19 07:03:19.985673
4f8a1433-6295-424d-8edc-84e11c42f474	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Za zaprtimi vrati	B. A. Paris	read	10	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/285549824	\N	\N	\N	\N	2026-08-19 07:04:24.990904	2026-08-19 07:04:24.990904
272208f0-82b1-4fa3-934b-af6a1bd840d9	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Resnica o Verity	Colleen Hoover	read	10	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/84484099	\N	\N	\N	\N	2026-08-19 07:05:14.144924	2026-08-19 07:05:14.144924
abb64313-01d5-4120-a761-23b9fd332677	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Nadomestna mati	Freida McFadden	read	10	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/266746627	\N	\N	\N	\N	2026-08-19 07:06:50.374845	2026-08-19 07:06:50.374845
3497acc6-362c-4e9f-b21b-b96b51405a64	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Vsiljivka	Freida McFadden	read	8	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/270014467	\N	\N	\N	\N	2026-08-19 07:05:58.764363	2026-08-19 07:06:56.862
ea1fe81c-ed1c-4807-90eb-dd87878e787d	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Ti povem skrivnost?	Freida McFadden	read	1	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/277552387	\N	\N	\N	\N	2026-08-19 07:07:41.410485	2026-08-19 07:07:41.410485
60cc8578-3914-4d4a-a309-a40d9a7dedb0	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Draga Debbie	Freida McFadden	read	8	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/268681219	\N	\N	\N	\N	2026-08-19 07:08:31.599273	2026-08-19 07:08:31.599273
983038fc-8c4a-49c6-95d5-1c2e246a0cf0	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Zaklenjena vrata	Freida McFadden	read	9	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/266572547	\N	\N	\N	\N	2026-08-19 07:09:20.178943	2026-08-19 07:09:20.178943
a7d32b07-30ea-4f6a-898c-064c291f5662	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Oddelek D	Freida McFadden	read	10	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/263680003	\N	\N	\N	\N	2026-08-19 07:09:59.594723	2026-08-19 07:09:59.594723
302fdce3-d033-466d-aa74-712c9c70ccd1	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Se spomniš?	Freida McFadden	read	8	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/257713411	\N	\N	\N	\N	2026-08-19 07:10:37.470971	2026-08-19 07:10:37.470971
d6686236-7888-4986-b858-dc294c071e4e	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Izbranec	Freida McFadden	read	10	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/254793731	\N	\N	\N	\N	2026-08-19 07:11:34.803854	2026-08-19 07:11:34.803854
ef1c11d8-73f5-48f6-94a8-00fcae997f6f	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Najemnica	Freida McFadden	read	10	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/246863363	\N	\N	\N	\N	2026-08-19 07:12:15.440161	2026-08-19 07:12:15.440161
8c2841a8-1bd3-4ef3-b042-a07b2446ad03	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Trk	Freida McFadden	read	8	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/230753539	\N	\N	\N	\N	2026-08-19 07:12:49.753653	2026-08-19 07:12:49.753653
63fb1ffd-5f43-4ca2-ab96-bf3cd2edeb6a	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Popolni sin	Freida McFadden	read	4	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/225872643	\N	\N	\N	\N	2026-08-19 07:13:28.124669	2026-08-19 07:13:28.124669
3d4c5e4b-c23f-4a96-8f25-55d235046de2	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Nikoli ne laži	Freida McFadden	read	10	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/212224259	\N	\N	\N	\N	2026-08-19 07:14:04.20245	2026-08-19 07:14:04.20245
2a0544ba-0d78-46a5-89d0-55fcecdd92be	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Učiteljica	Freida McFadden	read	8	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/194009091	\N	\N	\N	\N	2026-08-19 07:14:47.840257	2026-08-19 07:14:47.840257
fc4f1bee-bb9e-4462-a5fc-e03494251cae	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Hišna pomočnica opazuje	Freida McFadden	read	8	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/195182083	\N	\N	\N	\N	2026-08-19 07:15:28.715751	2026-08-19 07:15:28.715751
e55e6704-927d-4e8e-8714-c6e960997012	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Skrivnost hišne pomočnice	Freida McFadden	read	8	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/161548803	\N	\N	\N	\N	2026-08-19 07:16:24.361979	2026-08-19 07:16:24.361979
bafd865f-31ce-44b6-912b-c96f73b6e2cd	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Sodelavka	Freida McFadden	read	8	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/186821891	\N	\N	\N	\N	2026-08-19 07:17:05.327575	2026-08-19 07:17:05.327575
d5d9f979-719f-4f40-bbdc-319412dfd8dd	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Zapornik	Freida McFadden	read	10	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/237954819	\N	\N	\N	\N	2026-08-19 07:17:55.083045	2026-08-19 07:17:55.083045
2cd2936c-86fd-415a-9f52-0cb6be40825b	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Nič od tega ni res	Lisa Jewell	read	6	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/195310083	\N	\N	\N	\N	2026-08-19 07:18:42.967957	2026-08-19 07:18:42.967957
96d64b9f-0cd4-4549-8685-5cf4946e494d	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Gostja v družini	Nelle Lamarr	read	10	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/174286595	\N	\N	\N	\N	2026-08-19 07:19:18.257548	2026-08-19 07:19:18.257548
6f617329-a1e4-48cb-80dc-d191c741b0f2	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Medicinska sestra	J. A. Corrigan	read	10	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/78823427	\N	\N	\N	\N	2026-08-19 07:20:04.155462	2026-08-19 07:20:04.155462
7ccce5b1-2d16-46f6-8a12-602b84269f7f	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Izginulo dekle	Claire Douglas	read	10	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/109322499	\N	\N	\N	\N	2026-08-19 07:20:42.89773	2026-08-19 07:20:42.89773
3122591c-156c-464b-8860-ed29613fd390	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Popolni zakon	Jeneva Rose	read	10	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/188928003	\N	\N	\N	\N	2026-08-19 07:21:20.129354	2026-08-19 07:21:20.129354
f6d7f521-4be5-4f94-b524-184ee1316582	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Hišna pomočnica	Freida McFadden	read	10	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/145936899	\N	\N	\N	\N	2026-08-19 07:22:14.579269	2026-08-19 07:22:14.579269
cf8cb2a5-1a90-4bf2-bfb7-5bf20061cb12	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Nočna varuška	Nelle Lamarr	reserved	\N	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/231009539	\N	\N	\N	\N	2026-08-19 07:23:47.231308	2026-08-19 07:23:47.231308
c222018a-707e-4745-99d1-ef25f9f805f1	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Par na hišni številki 9	Claire Douglas	reserved	\N	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/181553667	\N	\N	\N	\N	2026-08-19 07:24:18.138737	2026-08-19 07:24:18.138737
46a5a221-df6d-45f0-aebe-578907540e0b	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Sredi noči	Riley Sager	reserved	\N	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/231559171	\N	\N	\N	\N	2026-08-19 07:24:56.337954	2026-08-19 07:24:56.337954
70357a2a-36a6-4bb1-bb40-cce6c9f40582	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Družina nad nami	Lisa Jewell	wishlist	\N	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/89450499	\N	\N	\N	\N	2026-08-19 07:25:56.866274	2026-08-19 07:26:17.575
41ed3d2a-454a-466f-b28b-d52db3d7ac68	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Noč, ko je izginila	Lisa Jewell	wishlist	\N	#ffffff	\N	Kriminalka	\N	https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1628703473i/55922299.jpg	\N	\N	\N	\N	2026-08-19 07:29:16.694311	2026-08-19 07:29:16.694311
eac80685-6418-47e9-b915-52d5bb17ecab	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Potem je ni bilo več	Lisa Jewell	wishlist	\N	#ffffff	\N	Kriminalka	\N	https://blackwells.co.uk/jacket/l/9781784756253.jpg	\N	\N	\N	\N	2026-08-19 07:36:31.633776	2026-08-19 07:36:31.633776
e91dde2f-e1e0-4bbe-b520-40da43beef19	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Dekle na vlaku	Paula Hawkins	cancelled	\N	#ffffff	ni mi všeč	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/291845376	\N	\N	\N	\N	2026-08-19 07:01:01.487661	2026-08-19 08:27:28.354
7f68b0cd-ba82-41b8-91cd-9338674ef179	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Edina preživela	Riley Sager	read	10	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/194637571	\N	\N	\N	\N	2026-08-19 07:23:15.875203	2026-08-25 19:02:40.017
69bc1ce8-5403-4501-9dd1-8d40903b6693	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Neznanec v hiši	Shari Lapena	read	10	#ffffff	Mirna soseska na severu države New York. En moški med dvema ženskama in ena ženska med dvema moškima. Moški je Tom, mlad uradnik, dve ženski sta Tomova nekdanja ljubica in še vedno soseda Brigid, druga pa je Karen, s katero je Tom poročen skoraj dve leti. Glavna ženska romana je prav ona, Karen, ki je svojega bodočega moža spoznala, ko je začasno nadomeščala knjigovodkinjo v podjetju, kjer je mož zaposlen, se z mladostnim zanosom poročila, ugnezdila v njegovo hišo in postala vzorna gospodinja in potencialna mati njunih otrok. Če se ne bi v življenju mladega para pojavil drugi moški. Mrtev. Moški, ki je postal truplo ravno v času, ko je sicer mirna in srečna Karen panično divjala po četrti dvomljivega slovesa, se zaletela v drog in ob pretresu možganov začasno izgubila spomin. Sta mrtev moški in prometna nesreča povezana?	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/293424384	\N	\N	\N	\N	2026-08-19 08:49:55.095082	2026-08-19 11:28:08.538
5585c8dd-db88-4b74-bef4-c0593cce0cbd	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	PAR IZ SOSEDNJE HIŠE	SHARI LAPENA	read	10	#ffffff	Anne in Marco in njuna šestmesečna dojenčica Cora živijo v razkošni vrstni hiši v manjšem kraju na severu države New York. Na drugi strani skupne stene hiše živita Cynthia in Graham, par brez otrok. Za Grahamov štirideseti rojstni dan Cyntihia priredi zabavo, na katero sta povabljena samo Anne in Marco. Coro pustita doma, v otroški posteljici, in jo iz hiše sosedov izmenično hodita kontrolirati vsake pol ure. Dojenčica skrivnostno izgine. Obupana starša pokličeta policijo. Na prizorišču zločina se še isto noč pojavijo starši Anne, Richard in Alice, policija in detektiv Rasbach s sodelavcem Jenningsom. Primer kmalu postane medijsko odmeven, medsebojni odnosi se vedno bolj zaostrujejo, ugrabitelji zahtevajo odkupnino. Je Cora živa ali mrtva? Kdo s Corinim izginotjem razčiščuje svojo preteklost in kdo z ugrabitvijo ureja svojo prihodnost?	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/292750080	\N	\N	\N	\N	2026-08-19 11:35:39.292075	2026-08-20 12:31:28.891
3e413465-1807-491e-8575-921ef4c324ae	1609d7a7-de34-4c37-ae85-b27d6a0b41bd	Mavrične vile: Čarobne vilinske zgodbe	Daisy Meadows	wishlist	\N	#ffffff	\N	\N	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/237111296	\N	\N	\N	\N	2026-08-20 16:22:16.064058	2026-08-20 16:22:16.064058
cb14d97e-9c7c-4d91-8c93-476468cf5d38	e2ba1b89-42bd-4916-861a-196df7cbd148	Ema, vila muckov	Daisy Meadows	read	\N	#ffffff	\N	Mladinska	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/253230336	\N	\N	\N	\N	2026-08-21 17:10:03.031406	2026-08-21 17:10:03.031406
86e1f1f2-ef75-4073-a97c-c4df1737bcc6	e2ba1b89-42bd-4916-861a-196df7cbd148	Pia, vila zajčkov	Daisy Meadows	read	10	#ffffff	\N	Mladinska	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/253230592	\N	\N	\N	\N	2026-09-01 05:34:19.568669	2026-09-01 05:34:19.568669
95b1897a-aaf3-4e56-9b5c-6d9419712721	e2ba1b89-42bd-4916-861a-196df7cbd148	Ana, vila morskih prašičkov	Daisy Meadows	read	10	#ffffff	\N	Mladinska	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/253914112	\N	\N	\N	\N	2026-09-05 04:54:50.649739	2026-09-05 04:54:50.649739
6b9eacd7-b1c9-447d-bf34-aa34fa0c9d0b	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Edini	John Marrs	read	8	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/293323264	\N	\N	\N	\N	2026-08-25 19:04:43.129963	2026-09-09 14:32:20.288
6fef0766-42e7-4d0e-a100-d00fc1c70b60	03afe5ca-8fa5-4c8f-9403-1280fbd3c786	Tetka	Valérie Perrin	wishlist	\N	#ffffff	\N	Kriminalka	\N	https://d.cobiss.net/repository/si/thumbnails/cobib/275751427	\N	\N	\N	\N	2026-09-15 12:28:06.114996	2026-09-15 12:28:06.114996
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, display_name, password_hash, is_admin, created_at) FROM stdin;
03afe5ca-8fa5-4c8f-9403-1280fbd3c786	nina	Nina	$2b$12$aUfaWE.uFQge.j1uAjDcbOOpe30bKKtugX6U/20ZM6CiTrJ.78LEW	t	2026-08-18 16:36:01.348416
c503d169-deb2-46b6-b6c4-0a2fb8b3c9f5	matjaz	Matjaž	$2b$12$G4/igb0J7VkizTJ1ObnHKO3.F8UPmi7jlp8vtimSPXGAt3hkUnWbi	t	2026-08-19 09:32:51.398029
e2ba1b89-42bd-4916-861a-196df7cbd148	neza	Neža	$2b$12$WB/BHvntgur4oCa28xZczuiRLDzA2v/sZD0FzkzUylQ8AWix/iz7S	f	2026-08-19 09:33:29.069492
1609d7a7-de34-4c37-ae85-b27d6a0b41bd	azbe	Ažbe	$2b$12$4eAWZDAf4XlbJbJhi42ad.D4Hxf36nDtlgKdZpq31ylSz93uFj5Fa	f	2026-08-19 09:33:53.652675
\.


--
-- Name: books books_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_books_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_books_status ON public.books USING btree (status);


--
-- Name: idx_books_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_books_user_id ON public.books USING btree (user_id);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: books books_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict S83xeAs2BMuiDeMXcjR4WBqqhh1nxRYdJklwXaxhfHxehsDKof8di3oEaAgBoP8

