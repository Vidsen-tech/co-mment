<x-mail::message>
    # Novi upit za radionicu

    Stigao je novi upit putem web stranice.

    **Ime i Prezime (Name):**<br>
    {{ $inquiryData['name'] }}

    **Kontakt (Contact Info):**<br>
    {{ $inquiryData['contact'] }}

    ---

    **Poruka (Message):**
    <x-mail::panel>
        {{ $inquiryData['message'] }}
    </x-mail::panel>

    Hvala,<br>
    {{ config('app.name') }}
</x-mail::message>
