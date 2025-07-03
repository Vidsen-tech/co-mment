<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RiderRequestMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * The inquiry data.
     * @var array
     */
    public $inquiryData;

    /**
     * Create a new message instance.
     * @param array $inquiryData
     * @return void
     */
    public function __construct(array $inquiryData)
    {
        $this->inquiryData = $inquiryData;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        // Set a specific subject for the rider request
        $subject = 'Zahtjev za tehničku dokumentaciju: ' . $this->inquiryData['work_title'];

        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
        // Point to a new blade template we will create
            markdown: 'emails.rider-request',
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}
