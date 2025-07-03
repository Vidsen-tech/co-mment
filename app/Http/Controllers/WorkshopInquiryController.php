<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Redirect;
use App\Mail\WorkshopInquiryMail;
use Inertia\Inertia;
use App\Mail\RiderRequestMail;

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
        $recipientEmail = 'luka.vidovic.biz@gmail.com';

        Mail::to($recipientEmail)->send(new WorkshopInquiryMail($validatedData));

        return Redirect::back();
    }

    public function sendRiderRequest(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'contact' => 'required|string|max:255',
            'message' => 'required|string',
            'work_title' => 'required|string|max:255', // Also validate the work title
        ]);

        // Replace with the same recipient email address
        Mail::to('luka.vidovic.biz@gmail.com')->send(new RiderRequestMail($validatedData));

        return Redirect::back();
    }
}
