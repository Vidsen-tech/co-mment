<?php

namespace Database\Seeders;

use App\Models\Work;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WorkSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clean up old data to avoid duplicates when re-seeding
        DB::table('works')->delete();

        // --- WORK 1: ..., a još su manji izlazi ---
        $work1 = Work::create([
            'slug' => 'a-jos-su-manji-izlazi',
            'premiere_date' => '2023-06-30',
            'is_active' => true,
        ]);

        $work1->translations()->createMany([
            [
                'locale' => 'hr',
                'title' => '…, a još su manji izlazi',
                'description' => json_encode([
                    'main' => '“..., a još su manji izlazi” je plesna predstava koja u formi dueta izlaže specifičan odnos prema prostoru izvedbe i perspektivi gledatelja. Nadahnuti filmom Tango Zbigniewa Rybczyńskog iz 1981. godine, uočili smo da se specifičnost organizacije ovog filmskog sadržaja ogleda u upravljanju prostorom kojeg ne vidimo, tj. u upravljanju ulazima i izlazima. Inspirirani time, izgradili smo koreografiju na ideji podjele prostora na on i off screen, stvarajući prostor koji se otkriva perspektivom gledatelja. Postavljamo si glavno problemsko pitanje “Što bi to bio on i off screen među tijelima?”. Konceptom “kolažiranja” i specifičnom organizacijom prostora u kojem izvođačice i gledatelji djeluju kao jednaki akteri predstave, gradimo materijal koji se oslanja na principima i mehanizmima pomicanja, rezanja i lijepljenja slika. Poseban značaj ima smještaj publike u prostoru, odabirom mjesta svaki gledatelj odabire perspektivu iz koje će gledati izvedbu. Koreografski materijal, koji se temelji na principu kolaža, uvjetuje da i najmanji pomak može napraviti veliku razliku u percepciji onoga što vidimo. Iako svi gledatelji svjedoče istoj izvedbi, ona se za svakoga od njih razlikuje upravo zbog različitih pozicija i perspektiva kroz koje prate izvedbu. To stvara izazov za manipulaciju pažnje i očekivanja gledatelja, dok se istovremeno koristi nevidljivi prostor kao sredstvo za imaginaciju i anticipaciju.',
                    'credits' => [
                        'Koreografija i izvedba' => 'Dora Pocedić i Linda Tarnovski',
                        'Dramaturgija' => 'Luka Bosanac',
                        'Glazba' => 'Elizabeta Marjanović',
                        'Tehnička podrška' => 'Jasmin Dasović i Lana Nežmah',
                        'Produkcija' => 'Pogon - Zagrebački centar za nezavisnu kulturu i mlade',
                        'Dizajn' => 'Bojan Crnić',
                        'Posebne zahvale' => 'MO “Voćarska”, NTS Dancestore, Goran Pocedić',
                        'Trailer' => 'https://vimeo.com/1014699355',
                    ]
                ])
            ],
            [
                'locale' => 'en',
                'title' => '…, and the exits are even smaller',
                'description' => json_encode([
                    'main' => '"..., and the exits are even smaller" is a dance performance that, in the form of a duet, exposes a specific relationship to the performance space and the perspective of the viewer. Inspired by the 1981 film Tango by Zbigniew Rybczyński, we observed that the specificity of organizing this filmic content lies in managing space that we cannot see, i.e., in managing entrances and exits. Inspired by this, we constructed a choreography based on the idea of dividing the space into on-screen and off-screen, creating a space that is revealed through the viewer\'s perspective. We ask ourselves the main problem question: "What would on and off screen between bodies be?" With the concept of "collaging" and a specific organization of space, in which performers and viewers act as equal participants in the performance, we build material based on the principles and mechanisms of shifting, cutting, and gluing images. A special focus is placed on the positioning of the audience in the space; by choosing a place, each viewer selects the perspective from which they will observe the performance. The choreographic material, based on the collage principle, dictates that even the smallest movement can make a significant difference in the perception of what we see. Although all viewers witness the same performance, it differs for each of them due to the varying positions and perspectives through which they follow the performance. This creates a challenge for manipulating the attention and expectations of the audience, while simultaneously using the invisible space as a means for imagination and anticipation.',
                    'credits' => [
                        'Choreography and performance' => 'Dora Pocedić and Linda Tarnovski',
                        'Dramaturgy' => 'Luka Bosanac',
                        'Music' => 'Elizabeta Marjanović',
                        'Technical support' => 'Jasmin Dasović and Lana Nežmah',
                        'Production' => 'Pogon - Zagreb Center for Independent Culture and Youth',
                        'Design' => 'Bojan Crnić',
                        'Special thanks' => 'MO “Voćarska”, NTS Dancestore, Goran Pocedić',
                        'Trailer' => 'https://vimeo.com/1014699355',
                    ]
                ])
            ],
        ]);

        $work1->showings()->createMany([
            ['performance_date' => '2023-06-30 20:00:00', 'location' => 'Pogon Jedinstvo (Pogon)'],
            ['performance_date' => '2023-07-01 20:00:00', 'location' => 'Pogon Jedinstvo (Pogon)'],
            ['performance_date' => '2023-09-03 20:00:00', 'location' => 'Pogon Jedinstvo (Pogon)'],
            ['performance_date' => '2024-02-09 20:00:00', 'location' => 'Zagrebački plesni centar (Pogon, ZPC)'],
            ['performance_date' => '2024-02-10 20:00:00', 'location' => 'Zagrebački plesni centar (Pogon, ZPC)'],
            ['performance_date' => '2024-03-26 20:00:00', 'location' => 'Pogon Jedinstvo (Pogon)'],
            ['performance_date' => '2024-08-16 20:00:00', 'location' => 'Festival de danse Manoir en Mouvement, Francuska'],
            ['performance_date' => '2024-08-17 20:00:00', 'location' => 'Festival de danse Manoir en Mouvement, Francuska'],
            ['performance_date' => '2024-10-20 20:00:00', 'location' => 'TALA PLE(J)S (Plesni centar Tala, UO Co-mment)'],
            ['performance_date' => '2024-12-01 20:00:00', 'location' => 'TALA PLE(j)S (Plesni centar Tala, UO Co-mment)'],
            ['performance_date' => '2024-12-03 20:00:00', 'location' => 'Zagrebački plesni centar (Pogon, ZPC, UO Co-mment)'],
            ['performance_date' => '2024-12-07 20:00:00', 'location' => 'Galerija Filodrammatica, Rijeka (UO Co-mment)'],
            ['performance_date' => '2025-03-15 20:00:00', 'location' => 'Centar za kulturu i informacije Maksimir'],
            ['performance_date' => '2025-03-28 20:00:00', 'location' => 'Pogon Jedinstvo'],
            ['performance_date' => '2025-03-29 20:00:00', 'location' => 'Pogon Jedinstvo'],
        ]);

        // --- WORK 2: Co-lažiranje ---
        $work2 = Work::create([
            'slug' => 'co-laziranje',
            'premiere_date' => '2024-05-24',
            'is_active' => true,
        ]);

        $work2->translations()->createMany([
            [
                'locale' => 'hr',
                'title' => 'Co-lažiranje',
                'description' => json_encode([
                    'main' => '“Nastavljajući istraživanje metode kolažiranja pojavljuje se potreba za odmakom - promjenom perspektive, pogledom izvana, rastavljanjem metode nastale po principu sastavljanja, pomicanja, rezanja i lijepljenja slika. U potrazi za negativom izvedbe izranjaju fragmenti uhvatljivog, i postavlja se pitanje: gdje/kakva je kretnja (između) obrisa? Tamo gdje je ostavljen nevidljivi rad (...,a još su manji izlazi), izviru rubovi iskustva i granice višestrukih mogućnosti. Co-lažiranje je između analize i izvedbe, razmišljanja i prezentiranja, prijenosa i kombiniranja, jezika i jezika. Na pola puta između dva prostora priziva se staro, priželjkuje novo i otvara se prostor za sve ono između.” - Anna Javoran. Projekt Co-lažiranje je plesno-izlagački rad napravljen za galerijske prostore. Bavi se pitanjem izlaganja i prezentacije već postojećeg rada “…, a još su manji izlazi” pomoću plesnog vokabulara i projekcije grafoskopa. Ova specifična postavka naglašava istraživanje metode kolažiranja, gdje se pojavljuje potreba za odmakom i promjenom perspektive. Izvan okvira tradicionalne izvedbe, kroz proces rastavljanja metode nastale po principu sastavljanja, pomicanja, rezanja i lijepljenja slika, izranjaju fragmenti uhvatljivog, postavljajući pitanje: gdje i kakva je kretnja (između) obrisa? Završetkom izvedbe, prostor je ispunjen “ostacima” naše izvedbe koji se mogu percipirati kao zasebna izložba ili prikaz izvedbe u drugom, vizualnom mediju. Glavni cilj je istražiti i dekodirati tradicionalne izvedbene metode kroz proces kolažiranja, gdje se plesni vokabular koristi za promišljanje o granicama između izvedbe i izlaganja. Želimo stvoriti prostor za nova tumačenja i reinterpretacije postojećih radova, preispitujući kako se izvedba može prenijeti u vizualni medij i obratno. Cilj je aktivirati gledatelja da ne bude pasivni promatrač, već da postane svjestan da je izvedba dinamičan proces u kojem i sam sudjeluje pa tako i izložba koja se na prvu čini statičnom i jednosmjernom, a zapravo također može tražiti povratnu informaciju gledatelja kao i izvedba.',
                    'credits' => [
                        'Koreografija i izvedba' => 'Dora Pocedić i Linda Tarnovski',
                        'Dramaturgija' => 'Anna Javoran',
                        'Produkcija' => 'Udruga profesionalnih plesnih umjetnika PULS',
                        'Koprodukcija' => 'Prirodno-umjetnički kružok & UO Co-mment',
                    ]
                ])
            ],
            [
                'locale' => 'en',
                'title' => 'Co-llaging',
                'description' => json_encode([
                    'main' => '“Continuing the exploration of the collage method, the need for a distance arises – a change in perspective, an external view, deconstructing a method formed by the principles of assembling, shifting, cutting, and gluing images. In the search for the negative of the performance, fragments of the graspable emerge, and the question arises: where/what is the movement (between) the outlines? Where the invisible work remains (..., and the exits are even smaller), the edges of experience and the boundaries of multiple possibilities emerge. “Co-llaging” is between analysis and performance, thinking and presenting, transferring and combining, language and language. Halfway between two spaces, the old is evoked, the new is desired, and a space opens up for everything in between.” - Anna Javoran. The project Co-llaging is a dance-exhibition work created for gallery spaces. It addresses the question of exhibiting and presenting an already existing work, “…, and the exits are even smaller,” through the use of dance vocabulary and overhead projector projections. This specific setup emphasizes exploring the method of collage-making, highlighting the need for distance and a shift in perspective. Beyond the framework of traditional performance, through a process of deconstructing a method originally based on assembling, shifting, cutting, and gluing images, fragments of the graspable emerge, posing the question: where and what is the movement (between) the outlines? Upon the performance’s conclusion, the space is filled with the "leftovers" of our performance, which can be perceived as an independent exhibition or as a representation of the performance in another, visual medium. The main goal is to explore and decode traditional performance methods through the process of collage-making, where dance vocabulary is used to reflect on the boundaries between performance and exhibition. We aim to create a space for new interpretations and reinterpretations of existing works, questioning how performance can be transferred to a visual medium and vice versa. The goal is to activate the viewer, transforming them from a passive observer into someone aware that performance is a dynamic process in which they also participate. In this way, even an exhibition that at first seems static and one-directional can seek feedback from the viewer, just as a performance does.',
                    'credits' => [
                        'Choreography and Performance' => 'Dora Pocedić and Linda Tarnovski',
                        'Dramaturgy' => 'Anna Javoran',
                        'Production' => 'Professional Dance Artists Association PULS',
                        'Co-production' => 'Prirodno-umjetnički kružok & UO Co-mment',
                    ]
                ])
            ],
        ]);

        $work2->showings()->createMany([
            ['performance_date' => '2024-05-24 20:00:00', 'location' => 'GARAŽA KAMBA (Prirodno-umjetnički kružok, UPPU PULS, UO Co-mment)'],
            ['performance_date' => '2024-05-25 20:00:00', 'location' => 'GARAŽA KAMBA (Prirodno-umjetnički kružok, UPPU PULS, UO Co-mment)'],
            ['performance_date' => '2024-06-14 20:00:00', 'location' => 'GALERIJA O.K., RIJEKA (Galerija O.K., ArtKvart, UO Co-mment, Crta za beskraj)'],
            ['performance_date' => '2024-07-16 20:00:00', 'location' => 'Art radionica Lazareti, DUBROVNIK (ARL, UO Co-mment)'],
            ['performance_date' => '2024-11-21 20:00:00', 'location' => 'LEXART (LEXART skladište, UO Co-mment)'],
            ['performance_date' => '2024-11-22 20:00:00', 'location' => 'LEXART (LEXART skladište, UO Co-mment)'],
            ['performance_date' => '2024-11-25 20:00:00', 'location' => 'Galerija Siva, AKKC ATTACK (kazalište sjena Tripstih, AKKC ATTACK, UO Co-mment, 8. Festival grafoskopa)'],
            ['performance_date' => '2024-12-10 20:00:00', 'location' => 'Interpretacijski centar Muzeja Turopolja,VELIKA GORICA (Yelo produkcija, UO Co-mment, Art Bubble 2024)'],
            ['performance_date' => '2025-03-05 20:00:00', 'location' => 'Pogon Jedinstvo (UO Co-mment)'],
            ['performance_date' => '2025-03-06 20:00:00', 'location' => 'Pogon Jedinstvo (UO Co-mment)'],
            ['performance_date' => '2025-03-08 20:00:00', 'location' => 'Centar za kulturu i informacije Maksimir (UO Co-mment)'],
            ['performance_date' => '2025-05-10 20:00:00', 'location' => 'Kazalište Dubrava, Kvart je art (Empiria Teatar)'],
        ]);
    }
}
