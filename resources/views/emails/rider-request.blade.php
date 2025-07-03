<x-mail::message>
    {{-- Email Header --}}
    # Zahtjev za Tehničku Dokumentaciju

    Dobar dan,

    Stigao je zahtjev za tehničku dokumentaciju (rider) za predstavu: **"{{ $inquiryData['work_title'] }}"**.

    Ovdje su detalji pošiljatelja:

    ---

    {{-- User Details Table --}}
    <x-mail::table>
        | Detalj          | Podatak                            |
        | :-------------- | :--------------------------------- |
        | **Ime i Prezime** | {{ $inquiryData['name'] }}         |
        | **Kontakt** | {{ $inquiryData['contact'] }}      |
    </x-mail::table>

    {{-- User Message Panel --}}
    ## Poruka Pošiljatelja:

    <x-mail::panel>
        {{ $inquiryData['message'] }}
    </x-mail::panel>

    Lijep pozdrav,<br>
    Vaš {{ config('app.name') }}
</x-mail::message>
