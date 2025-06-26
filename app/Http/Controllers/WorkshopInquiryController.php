<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Redirect;
use App\Mail\WorkshopInquiryMail;
use Inertia\Inertia;

class WorkshopInquiryController extends Controller
{
    /**
     * Handle the incoming workshop inquiry.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function send(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'contact' => 'required|string|max:255',
            'message' => 'required|string|max:5000',
        ]);

        // IMPORTANT: The recipient email address.
        $recipientEmail = 'uo.comment@gmail.com';

        Mail::to($recipientEmail)->send(new WorkshopInquiryMail($validatedData));

        return Redirect::back();
    }
}
