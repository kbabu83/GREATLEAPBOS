<?php

namespace App\Mail;

use App\Models\Tenant\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RefundMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Invoice $invoice,
        public float $refundAmount,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Refund Confirmation - Invoice #' . $this->invoice->invoice_number,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.refund',
            with: [
                'invoice' => $this->invoice,
                'refundAmount' => $this->refundAmount,
            ],
        );
    }
}
