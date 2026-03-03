import React, { useState, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAccentColor } from '../context/AccentColorContext';

/**
 * --- FIRST TIME SETUP: TERMS AND CONDITIONS SCREEN ---
 */
const TermsScreen = ({ onAccept, onDecline }) => {
    const { colors } = useAccentColor();
    const [scrolledToBottom, setScrolledToBottom] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const termsRef = useRef(null);

    const handleScroll = () => {
        if (termsRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = termsRef.current;
            // Consider "scrolled to bottom" if within 50px of the bottom
            if (scrollHeight - scrollTop - clientHeight < 50) {
                setScrolledToBottom(true);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-950 flex items-center justify-center overflow-y-auto">
            {/* Splash-style background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute top-1/4 left-1/4 w-96 h-96 ${colors.bgSoft} rounded-full blur-[150px] animate-[pulse_4s_ease-in-out_infinite]`}></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-[150px] animate-[pulse_5s_ease-in-out_infinite_1s]"></div>
                <div className="absolute inset-0 opacity-50" style={{ background: `radial-gradient(circle at 50% 50%, rgba(${colors.rgb}, 0.05), transparent 70%)` }}></div>
            </div>

            <div className="relative z-10 max-w-4xl w-full px-6 py-8 my-auto font-kumbh">
                <div className="text-center mb-8">
                    <h1 className="font-kumbh text-3xl font-semibold text-slate-100 tracking-[0.15em] mb-2">
                        Terms & Conditions
                    </h1>
                    <p className="text-sm text-slate-400">Please read carefully before continuing</p>
                </div>

                <div className="bg-slate-900/40 backdrop-blur border border-slate-800/50 rounded-2xl p-8 mb-6 max-h-[60vh] overflow-y-auto" ref={termsRef} onScroll={handleScroll}>
                    <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed font-kumbh">
                        <h2 className="text-xl font-serif text-slate-100 mb-4">VŒRYNTH SYSTÈME OS<br />END USER LICENSE AGREEMENT & TERMS OF USE</h2>
                        <p className="text-xs text-slate-400 mb-6">Last updated: 25 November 2025</p>

                        <p className="mb-4">This End User License Agreement and Terms of Use ("Agreement") is a legal contract between you ("you", "user") and Vœrynth Système, a software company based in Schmalkalden, Thuringia, Germany ("Vœrynth", "we", "us", "our"), governing your use of Vœrynth Système OS and any related software, interfaces, documentation, updates and services (collectively, the "Software").</p>

                        <p className="mb-4">By installing, accessing or using the Software, you confirm that you:</p>
                        <ul className="list-disc pl-6 mb-4 space-y-1">
                            <li>Have read and understood this Agreement; and</li>
                            <li>Agree to be legally bound by it.</li>
                        </ul>

                        <p className="mb-4">If you do not agree, do not install, access or use the Software.</p>
                        <p className="mb-6">Nothing in this Agreement removes or limits any mandatory consumer rights that apply under the laws of your country of residence.</p>

                        <h3 className="text-lg  text-slate-200 mt-6 mb-3">1. License Grant</h3>
                        <p className="mb-3"><strong className="text-slate-200">1.1 License Type</strong><br />Subject to your full and continuing compliance with this Agreement, Vœrynth grants you a limited, non-exclusive, non-transferable, revocable license to install and use the Software:</p>
                        <ul className="list-disc pl-6 mb-4 space-y-1">
                            <li>On hardware and a local network that you own or control;</li>
                            <li>Solely for personal, residential or internal use;</li>
                            <li>In compiled, object-code form only.</li>
                        </ul>

                        <p className="mb-3"><strong className="text-slate-200">1.2 No Transfer</strong><br />You may not rent, lease, lend, sell, sublicense, assign, distribute or otherwise transfer the Software, this Agreement, or any rights granted here, in whole or in part, to any third party without Vœrynth's prior written consent.</p>

                        <p className="mb-4"><strong className="text-slate-200">1.3 Prototype / Pre-Release Builds</strong><br />If the Software is marked "Beta", "Preview", "Internal Build", "Prototype" or similar, you acknowledge that:</p>
                        <ul className="list-disc pl-6 mb-4 space-y-1">
                            <li>The Software may contain bugs or defects, and features may be incomplete or subject to change;</li>
                            <li>The Software is provided "as is" without any guarantee of reliability, uptime or fitness for a particular purpose, including safety-critical use.</li>
                        </ul>

                        <h3 className="text-lg  text-slate-200 mt-6 mb-3">2. Local-Only Operation and Connectivity</h3>
                        <p className="mb-3"><strong className="text-slate-200">2.1 Local Processing by Design</strong><br />Vœrynth Système OS is designed to operate entirely within your local network. Configuration data, device states, logs and automations are processed and stored locally on your own hardware. The Software does not transmit this local data to Vœrynth's servers or to any cloud service operated by Vœrynth.</p>

                        <p className="mb-3"><strong className="text-slate-200">2.2 Inbound-Only Internet Use</strong><br />The Software may initiate outbound network requests solely for:</p>
                        <ul className="list-disc pl-6 mb-4 space-y-1">
                            <li>Checking for and downloading software updates from Vœrynth or trusted distribution channels; and</li>
                            <li>Fetching read-only data from third-party information providers, such as weather and mapping services (for example, Windy.com), to display within the interface.</li>
                        </ul>
                        <p className="mb-4">The Software does not send your local device states, camera feeds, sensor data or automation rules to these providers. Only the minimal information required to request such external data (for example, approximate geographic coordinates to obtain local weather) is transmitted.</p>

                        <p className="mb-4"><strong className="text-slate-200">2.3 No Cloud Account Required</strong><br />The Software does not require you to create a cloud account with Vœrynth. Remote access to your system, if implemented by you, is your own responsibility and typically relies on third-party tools or VPNs not controlled by Vœrynth.</p>

                        <h3 className="text-lg  text-slate-200 mt-6 mb-3">3. Permitted Use</h3>
                        <p className="mb-3">Subject to this Agreement, you may:</p>
                        <ol className="list-[lower-alpha] pl-6 mb-4 space-y-1">
                            <li>Install and run the Software on your home server, PC, tablet or similar devices that you own or control;</li>
                            <li>Use the Software to monitor and control devices within your private premises, such as lighting, climate, media, energy, access control and sensors;</li>
                            <li>Create and manage automations, scenes and integrations for your own household or private estate;</li>
                            <li>Make one backup copy of the Software solely for archival and disaster-recovery purposes.</li>
                        </ol>

                        <h3 className="text-lg  text-slate-200 mt-6 mb-3">4. Prohibited Use</h3>
                        <p className="mb-3">You must not, and must not permit others to:</p>
                        <ol className="list-[lower-alpha] pl-6 mb-4 space-y-1">
                            <li>Reverse engineer, decompile, disassemble or otherwise attempt to derive the source code, underlying ideas or algorithms of the Software, except where such restrictions are expressly prohibited by applicable law;</li>
                            <li>Modify, adapt, translate or create derivative works of the Software, except with Vœrynth's prior written permission;</li>
                            <li>Use the Software to provide a hosted or commercial service to third parties (for example, operating a multi-tenant control platform for paying customers) without a separate, written commercial agreement with Vœrynth;</li>
                            <li>Circumvent, disable or tamper with any security, licensing or access-control features;</li>
                            <li>Use the Software in environments where failure could reasonably be expected to result in death, personal injury or severe physical or environmental damage, including medical life-support systems, critical infrastructure or industrial safety systems;</li>
                            <li>Use the Software for any unlawful purpose, including unlawful surveillance, violation of data-protection or CCTV regulations, or unauthorized interception of communications;</li>
                            <li>Remove, obscure or alter any copyright, trademark or other proprietary notices contained in or displayed by the Software;</li>
                            <li>Systematically copy or scrape the Software's user interface, icons, layouts or artwork for the purpose of building a directly competing product.</li>
                        </ol>

                        <h3 className="text-lg  text-slate-200 mt-6 mb-3">5. Ownership and Intellectual Property</h3>
                        <p className="mb-3"><strong className="text-slate-200">5.1 Ownership</strong><br />The Software is licensed, not sold. Vœrynth and its licensors retain all right, title and interest in and to the Software, including all:</p>
                        <ul className="list-disc pl-6 mb-4 space-y-1">
                            <li>Source code and binaries;</li>
                            <li>Visual designs, layouts, icons and animations;</li>
                            <li>Names, logos and branding, including "Vœrynth Système" and "Vœrynth Système OS";</li>
                            <li>Documentation, configuration templates and associated materials.</li>
                        </ul>

                        <p className="mb-4"><strong className="text-slate-200">5.2 No Implied Rights</strong><br />No rights are granted to you except those expressly set out in this Agreement. All other rights are reserved by Vœrynth.</p>

                        <h3 className="text-lg  text-slate-200 mt-6 mb-3">6. Updates and Changes</h3>
                        <p className="mb-3"><strong className="text-slate-200">6.1 Software Updates</strong><br />Vœrynth may release updates, patches or new versions of the Software (collectively, "Updates") to improve security, stability, compatibility or features. Updates are obtained via outbound connections from your local system to trusted distribution endpoints.</p>

                        <p className="mb-3"><strong className="text-slate-200">6.2 Automatic Updates</strong><br />If you enable Automatic Updates within the Software, you authorize Vœrynth Système OS to check for, download and install Updates automatically. You can disable Automatic Updates where the settings allow it, but doing so may leave your system exposed to security vulnerabilities or compatibility issues.</p>

                        <p className="mb-4"><strong className="text-slate-200">6.3 Right to Change or Discontinue</strong><br />Vœrynth may modify, suspend or discontinue any feature of the Software at any time, particularly pre-release features, experimental modules or integrations that depend on third-party services.</p>

                        <h3 className="text-lg  text-slate-200 mt-6 mb-3">7. Data, Storage and Privacy</h3>
                        <p className="mb-3"><strong className="text-slate-200">7.1 Local Data Storage</strong><br />Device states, logs, automations, presence detections and similar operational data are stored on your own hardware within your own network. Vœrynth does not operate a central database of your home, your devices or your usage patterns.</p>

                        <p className="mb-3"><strong className="text-slate-200">7.2 No Telemetry by Default</strong><br />The Software does not send diagnostic or usage telemetry to Vœrynth by default. If a future version introduces optional diagnostic reporting, this will be clearly indicated in the interface and will require your explicit consent.</p>

                        <p className="mb-3"><strong className="text-slate-200">7.3 External Information Providers</strong><br />When the Software retrieves external data (for example, weather conditions from a provider such as Windy.com), the request may include limited information such as your approximate location or selected region in order to return relevant data. Such requests are made directly from your system to the third-party provider. Vœrynth does not intercept or store the responses.</p>

                        <p className="mb-4"><strong className="text-slate-200">7.4 Your Responsibility for Compliance</strong><br />You are responsible for ensuring that your use of cameras, microphones, sensors and other devices connected to the Software complies with applicable privacy, recording and data-protection laws in your jurisdiction, including any requirements to notify or obtain consent from individuals.</p>

                        <h3 className="text-lg  text-slate-200 mt-6 mb-3">8. Third-Party Services and Open-Source Components</h3>
                        <p className="mb-3"><strong className="text-slate-200">8.1 Third-Party Services</strong><br />The Software may interact with or display information from third-party services, websites or hardware devices. Those services are subject to their own terms and privacy policies. Vœrynth does not control and is not responsible for:</p>
                        <ul className="list-disc pl-6 mb-4 space-y-1">
                            <li>The availability, accuracy or behaviour of third-party services;</li>
                            <li>Any changes they make that break or degrade integrations;</li>
                            <li>Any data they collect or process directly from your system.</li>
                        </ul>
                        <p className="mb-4">Your relationship with such providers is solely between you and them.</p>

                        <p className="mb-4"><strong className="text-slate-200">8.2 Open-Source Components</strong><br />The Software may include or depend on open-source software components. Each such component is licensed under its own license terms. These licenses are provided in the documentation or "About" section of the Software. In the event of a direct conflict between this Agreement and an applicable open-source license for a particular component, the open-source license will prevail for that component.</p>

                        <h3 className="text-lg  text-slate-200 mt-6 mb-3">9. Security and Your Responsibilities</h3>
                        <p className="mb-3">You are responsible for:</p>
                        <ul className="list-disc pl-6 mb-4 space-y-1">
                            <li>Maintaining the security of the devices and network on which the Software runs, including operating system updates and firewall configuration;</li>
                            <li>Choosing strong passwords or keys and keeping them confidential;</li>
                            <li>Restricting physical and remote access to your systems to trusted individuals;</li>
                            <li>Configuring any remote-access methods in a secure way, if you choose to implement them independently.</li>
                        </ul>
                        <p className="mb-4">Vœrynth is not liable for any unauthorized access, configuration loss or damage arising from weak passwords, misconfigurations, unpatched systems or other security failures under your control.</p>

                        <h3 className="text-lg  text-slate-200 mt-6 mb-3">10. Feedback</h3>
                        <p className="mb-4">If you provide Vœrynth with any suggestions, ideas, enhancement requests or other feedback related to the Software ("Feedback"), you agree that Vœrynth may freely use, modify and incorporate such Feedback into its products without any obligation to you. To the extent permitted by law, you assign to Vœrynth all rights in such Feedback.</p>

                        <h3 className="text-lg  text-slate-200 mt-6 mb-3">11. Warranty Disclaimer</h3>
                        <p className="mb-3">To the maximum extent permitted by applicable law, the Software is provided:</p>
                        <p className="mb-3  text-slate-100">"AS IS" AND "AS AVAILABLE",<br />WITHOUT ANY WARRANTIES OF ANY KIND,<br />WHETHER EXPRESS, IMPLIED OR STATUTORY.</p>
                        <p className="mb-3">Without limiting the foregoing, Vœrynth expressly disclaims all implied warranties, including but not limited to:</p>
                        <ul className="list-disc pl-6 mb-4 space-y-1">
                            <li>Merchantability;</li>
                            <li>Fitness for a particular purpose;</li>
                            <li>Non-infringement;</li>
                            <li>Satisfactory quality;</li>
                            <li>Reliability, availability or error-free operation.</li>
                        </ul>
                        <p className="mb-3">Vœrynth does not warrant that:</p>
                        <ul className="list-disc pl-6 mb-4 space-y-1">
                            <li>The Software will meet your specific requirements;</li>
                            <li>The Software will be compatible with every device, integration or configuration;</li>
                            <li>The Software will operate without interruption or defects;</li>
                            <li>Any defects will be corrected within a particular timeframe.</li>
                        </ul>
                        <p className="mb-4  text-amber-400">Your use of the Software is entirely at your own risk.</p>

                        <h3 className="text-lg  text-slate-200 mt-6 mb-3">12. Limitation of Liability</h3>
                        <p className="mb-3">To the maximum extent permitted by applicable law, Vœrynth, its directors, employees, agents and licensors shall not be liable for any:</p>
                        <ul className="list-disc pl-6 mb-4 space-y-1">
                            <li>Indirect, incidental, consequential, special, punitive or exemplary damages;</li>
                            <li>Loss of profits, loss of data, loss of goodwill, business interruption or replacement costs;</li>
                        </ul>
                        <p className="mb-4">arising out of or related to your use of or inability to use the Software, whether based on warranty, contract, tort (including negligence) or any other legal theory, even if Vœrynth has been advised of the possibility of such damages.</p>
                        <p className="mb-4">Where liability cannot be excluded but may be limited, Vœrynth's total aggregate liability for all claims arising out of or related to this Agreement and the Software shall not exceed the amount you actually paid (if any) for the license to use the Software during the twelve (12) months immediately preceding the event giving rise to the claim.</p>
                        <p className="mb-4">Nothing in this Agreement limits or excludes any liability that cannot be limited or excluded under applicable law, including liability for gross negligence in jurisdictions where such limitations are not permitted.</p>

                        <h3 className="text-lg  text-slate-200 mt-6 mb-3">13. Indemnification</h3>
                        <p className="mb-3">You agree to indemnify, defend and hold harmless Vœrynth and its officers, employees and agents from and against any and all claims, damages, liabilities, losses, costs and expenses (including reasonable legal fees) arising out of or related to:</p>
                        <ul className="list-disc pl-6 mb-4 space-y-1">
                            <li>Your misuse of the Software;</li>
                            <li>Your breach of this Agreement;</li>
                            <li>Your violation of any applicable law or third-party rights in connection with your use of the Software or connected devices.</li>
                        </ul>

                        <h3 className="text-lg  text-slate-200 mt-6 mb-3">14. Term and Termination</h3>
                        <p className="mb-3"><strong className="text-slate-200">14.1 Term</strong><br />This Agreement becomes effective when you first install or use the Software and remains in effect until terminated.</p>
                        <p className="mb-3"><strong className="text-slate-200">14.2 Termination by You</strong><br />You may terminate this Agreement at any time by uninstalling or permanently deleting the Software from all devices and ceasing all use of it.</p>
                        <p className="mb-3"><strong className="text-slate-200">14.3 Termination by Vœrynth</strong><br />Vœrynth may suspend or terminate your license and access to Updates immediately if:</p>
                        <ul className="list-disc pl-6 mb-4 space-y-1">
                            <li>You materially breach this Agreement; or</li>
                            <li>Your use of the Software creates a security risk or legal exposure for Vœrynth.</li>
                        </ul>
                        <p className="mb-4"><strong className="text-slate-200">14.4 Effect of Termination</strong><br />Upon termination: The license granted to you under this Agreement immediately ends; You must stop using the Software and destroy all copies in your possession; Provisions that by their nature are intended to survive (including Ownership, Warranty Disclaimer, Limitation of Liability, Indemnification, Governing Law and Jurisdiction) will continue in full force.</p>

                        <h3 className="text-lg  text-slate-200 mt-6 mb-3">15. Export Control and Sanctions</h3>
                        <p className="mb-4">You must comply with all applicable export control and sanctions laws. You may not use or export the Software: To any person or jurisdiction subject to embargoes or trade sanctions; or For any purpose prohibited by such laws, including the development of weapons of mass destruction.</p>

                        <h3 className="text-lg  text-slate-200 mt-6 mb-3">16. Governing Law and Jurisdiction</h3>
                        <p className="mb-4">This Agreement and any dispute arising out of or in connection with it or the Software shall be governed by and construed in accordance with the laws of the Federal Republic of Germany, without regard to conflict-of-law principles.</p>
                        <p className="mb-4">If you are a business user, you and Vœrynth agree that the courts of Erfurt, Thuringia, Germany shall have exclusive jurisdiction.</p>
                        <p className="mb-4">If you are a consumer resident in the European Union, you may also bring claims in the courts of your country of residence where required by mandatory consumer-protection laws.</p>

                        <h3 className="text-lg  text-slate-200 mt-6 mb-3">17. Changes to This Agreement</h3>
                        <p className="mb-4">Vœrynth may modify this Agreement from time to time. When it does so, it will update the "Last updated" date at the top of this document. For material changes, Vœrynth may also display a notice within the Software.</p>
                        <p className="mb-4">If you continue to use the Software after the new version of the Agreement takes effect, you are deemed to have accepted the changes. If you do not agree, you must stop using the Software and uninstall it.</p>

                        <h3 className="text-lg  text-slate-200 mt-6 mb-3">18. Miscellaneous</h3>
                        <p className="mb-4">This Agreement constitutes the entire agreement between you and Vœrynth regarding the Software.</p>
                        <p className="mb-4">If any provision of this Agreement is held invalid or unenforceable, the remaining provisions shall remain in full force and effect, and the invalid provision shall be replaced with a valid provision that best reflects the original intent.</p>
                        <p className="mb-4">No failure or delay by Vœrynth in exercising any right under this Agreement shall be deemed a waiver of that right.</p>
                        <p className="mb-4">You may not assign or transfer this Agreement without Vœrynth's prior written consent. Vœrynth may assign this Agreement as part of a merger, acquisition or other corporate reorganization.</p>

                        <h3 className="text-lg  text-slate-200 mt-6 mb-3">19. Contact</h3>
                        <p className="mb-2">For questions about this Agreement or the Software, you can contact:</p>
                        <p className="mb-2 font-medium text-slate-100">Vœrynth Système<br />Schmalkalden, Thuringia<br />Germany</p>
                        <p className="text-amber-400">Email: contact@voerynth.de</p>
                    </div>
                </div>

                {!scrolledToBottom && (
                    <div className="text-center mb-4">
                        <p className="text-sm text-amber-400 flex items-center justify-center gap-2">
                            <AlertTriangle size={16} />
                            Please scroll to the bottom to continue
                        </p>
                    </div>
                )}

                <div className="bg-slate-900/40 backdrop-blur border border-slate-800/50 rounded-xl p-6 mb-6">
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            disabled={!scrolledToBottom}
                            className={`mt-1 w-5 h-5 rounded border-2 ${scrolledToBottom ? 'border-slate-600' : 'border-slate-700 opacity-50'} bg-slate-800 checked:${colors.bgSolid} transition-all`}
                        />
                        <span className={`text-sm ${scrolledToBottom ? 'text-slate-300' : 'text-slate-500'} group-hover:text-slate-200 transition-colors`}>
                            I have read and agree to the End User License Agreement and Terms of Use
                        </span>
                    </label>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={onDecline}
                        className="flex-1 py-4 rounded-xl bg-slate-800 text-slate-300  tracking-wider hover:bg-slate-700 transition-all duration-300"
                    >
                        DECLINE
                    </button>
                    <button
                        onClick={onAccept}
                        disabled={!agreedToTerms}
                        className={`flex-1 py-4 rounded-xl  tracking-wider transition-all duration-300 ${agreedToTerms
                            ? `${colors.bgSolid} text-slate-950 hover:scale-[1.02] shadow-lg ${colors.shadow}`
                            : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                            }`}
                    >
                        ACCEPT & CONTINUE
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TermsScreen;
