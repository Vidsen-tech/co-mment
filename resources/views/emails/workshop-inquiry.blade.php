<x-mail::message>
    {{-- Email Header --}}
    # Novi Upit za Radionicu

    Dobar dan,

    Stigao je novi upit putem web stranice. Ovdje su detalji:

    ---

    {{-- User Details Table --}}
    <x-mail::table>
        | Detalj          | Podatak                            |
        | :-------------- | :--------------------------------- |
        | **Ime i Prezime** | {{ $inquiryData['name'] }}         |
        | **Kontakt** | {{ $inquiryData['contact'] }}      |
    </x-mail::table>

    {{-- User Message Panel --}}
    ## Poruka Korisnika:

    <x-mail::panel>
        {{ $inquiryData['message'] }}
    </x-mail::panel>

    {{-- Optional: Button to link to your admin panel --}}
    <x-mail::button :url="'https://your-app-domain.com/admin/inquiries'" color="success">
        Pogledaj Upit u Admin Panelu
    </x-mail::button>

    Hvala,<br>
    Vaš {{ config('app.name') }}
</x-mail::message>
