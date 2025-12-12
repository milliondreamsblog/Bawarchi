export default function AdminFooter() {
    return (
        <footer className="bg-white border-t border-gray-200 mt-auto z-50">
            <div className="container max-w-7xl mx-auto px-6 py-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-gray-600 text-sm text-center md:text-left">
                        © {new Date().getFullYear()} Bawarchie. All rights reserved.
                    </p>
                    <div className="text-center md:text-right">
                        <p className="text-gray-500 text-xs">
                            Transforming dining experiences, one QR code at a time.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
