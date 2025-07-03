import { useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle } from 'lucide-react';
import { useEffect, FormEvent } from 'react';

// Define the shape of the content props for type safety
interface ModalContent {
    modalTitle: string;
    nameLabel: string;
    namePlaceholder: string;
    contactLabel: string;
    contactPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    sendButton: string;
    sendingButton: string;
    successMessage: string;
    closeButton: string;
}

// Define the component's props
interface ContactModalProps {
    show: boolean;
    onClose: () => void;
    localeContent: ModalContent;
}

export default function ContactModal({ show, onClose, localeContent }: ContactModalProps) {
    const { data, setData, post, processing, errors, wasSuccessful, reset } = useForm({
        name: '',
        contact: '',
        message: '',
    });

    // Reset the form when the modal is closed or after a successful submission
    useEffect(() => {
        if (wasSuccessful) {
            setTimeout(() => {
                reset();
                onClose();
            }, 3000); // Close modal 3 seconds after success
        }
    }, [wasSuccessful, reset, onClose]);


    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post(route('workshop.inquiry.send'), {
            preserveScroll: true,
            // Reset form state on success, but wait for the "success" view to show.
            onSuccess: () => {
                // The useEffect hook will handle the full reset and close.
            },
            onError: () => {
                // Optional: add error toast here if you want
            }
        });
    };

    // When the modal closes, we should reset the form state immediately
    const handleClose = () => {
        reset();
        onClose();
    }

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        // ★★★ THIS IS THE MAIN STYLE CHANGE ★★★
                        className="relative z-10 w-full max-w-lg rounded-xl bg-card/80 dark:bg-card/50 backdrop-blur-sm border border-border shadow-2xl shadow-black/10 dark:shadow-black/20"
                    >
                        {wasSuccessful ? (
                            <div className="p-8 text-center">
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                    <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                                </motion.div>
                                <h3 className="mt-4 text-2xl font-bold text-foreground">{localeContent.successMessage}</h3>
                                <p className="mt-2 text-muted-foreground">Javit ćemo vam se uskoro! / We'll get back to you soon!</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-foreground">{localeContent.modalTitle}</h2>
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full"
                                        aria-label={localeContent.closeButton}
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Name Field */}
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">{localeContent.nameLabel}</label>
                                        <input
                                            type="text"
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="w-full rounded-md border-border bg-transparent focus:ring-primary focus:border-primary"
                                            placeholder={localeContent.namePlaceholder}
                                            required
                                        />
                                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                    </div>

                                    {/* Contact Field */}
                                    <div>
                                        <label htmlFor="contact" className="block text-sm font-medium text-foreground mb-1">{localeContent.contactLabel}</label>
                                        <input
                                            type="text"
                                            id="contact"
                                            value={data.contact}
                                            onChange={(e) => setData('contact', e.target.value)}
                                            className="w-full rounded-md border-border bg-transparent focus:ring-primary focus:border-primary"
                                            placeholder={localeContent.contactPlaceholder}
                                            required
                                        />
                                        {errors.contact && <p className="text-red-500 text-sm mt-1">{errors.contact}</p>}
                                    </div>

                                    {/* Message Field */}
                                    <div>
                                        <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1">{localeContent.messageLabel}</label>
                                        <textarea
                                            id="message"
                                            rows={5}
                                            value={data.message}
                                            onChange={(e) => setData('message', e.target.value)}
                                            className="w-full rounded-md border-border bg-transparent focus:ring-primary focus:border-primary"
                                            placeholder={localeContent.messagePlaceholder}
                                            required
                                        />
                                        {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full inline-flex items-center justify-center gap-2 bg-primary px-6 py-3 rounded-md text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send size={18} />
                                        <span>{processing ? localeContent.sendingButton : localeContent.sendButton}</span>
                                    </button>
                                </div>
                            </form>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
