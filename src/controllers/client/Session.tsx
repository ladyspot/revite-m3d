import { action, computed, makeAutoObservable } from "mobx";
import { Client, API, SessionPrivate } from "revolt.js";
import { state } from "../../mobx/State";
import { resetMemberSidebarFetched } from "../../components/navigation/right/MemberSidebar";
import { modalController } from "../modals/ModalController";

type State = "Ready" | "Connecting" | "Online" | "Disconnected" | "Offline";

type Transition =
    | {
          action: "LOGIN";
          apiUrl?: string;
          session: SessionPrivate;
          configuration?: API.RevoltConfig;
          knowledge: "new" | "existing";
      }
    | {
          action: "SUCCESS" | "DISCONNECT" | "RETRY" | "LOGOUT" | "ONLINE" | "OFFLINE";
      };


      export default class Session {
        state: State = window.navigator.onLine ? "Ready" : "Offline";
        user_id: string | null = null;
        client: Client | null = null;
    
        constructor() {
            makeAutoObservable(this);
            window.addEventListener("online", this.onOnline.bind(this));
            window.addEventListener("offline", this.onOffline.bind(this));
    
            // Start checking the connection status periodically
            setInterval(() => this.checkConnection(), 30000); // Every 30 seconds
        }
    
        // Method to check the connection and reconnect if necessary
        @action checkConnection() {
            if (this.state === "Disconnected" && navigator.onLine) {
                this.emit({ action: "RETRY" });
            }
        }
    @action destroy() {
        if (this.client) {
            this.client.logout(false);
            this.state = "Ready";
            this.client = null;
        }
    }

    private onOnline() {
        if (this.state === "Offline") {
            this.emit({ action: "ONLINE" });
        }
    }

    private onOffline() {
        if (this.state !== "Offline") {
            this.emit({ action: "OFFLINE" });
        }
    }

    private onDropped() {
        this.emit({ action: "DISCONNECT" });
    }

    private onReady() {
        resetMemberSidebarFetched();
        this.emit({ action: "SUCCESS" });
    }

    private createClient(apiUrl?: string) {
        this.client = new Client({
            unreads: true,
            autoReconnect: false,
            onPongTimeout: "EXIT",
            apiURL: apiUrl ?? import.meta.env.VITE_API_URL,
        });

        this.client.addListener("dropped", this.onDropped.bind(this));
        this.client.addListener("ready", this.onReady.bind(this));
    }

    private destroyClient() {
        this.client!.removeAllListeners();
        this.client!.logout();
        this.user_id = null;
        this.client = null;
    }

    private assert(...state: State[]) {
        if (!state.includes(this.state)) {
            throw `State must be ${state} to transition! (currently ${this.state})`;
        }
    }

    private async continueLogin(data: Transition & { action: "LOGIN" }) {
        try {
            await this.client!.useExistingSession(data.session);
            this.user_id = this.client!.user!._id;
            state.auth.setSession(data.session);
        } catch (err) {
            this.state = "Ready";
            throw err;
        }
    }

    @action async emit(data: Transition) {
        console.info(`[FSM ${this.user_id ?? "Anonymous"}]`, data);

        switch (data.action) {
            case "LOGIN": {
                this.assert("Ready");
                this.state = "Connecting";
                this.createClient(data.apiUrl);

            

                if (data.configuration) {
                    this.client!.configuration = data.configuration;
                }

                if (data.knowledge === "new") {
                    await this.client!.fetchConfiguration();
                    this.client!.session = data.session;
                    (this.client! as any).$updateHeaders();

                    const { onboarding } = await this.client!.api.get("/onboard/hello");

                    if (onboarding) {
                        modalController.push({
                            type: "onboarding",
                            callback: async (username: string) =>
                                this.client!.completeOnboarding({ username }, false)
                                    .then(() => this.continueLogin(data)),
                        });
                        return;
                    }
                }

                await this.continueLogin(data);
                break;
            }
            case "SUCCESS": {
                this.assert("Connecting");
                this.state = "Online";
                break;
            }
            case "DISCONNECT": {
                if (navigator.onLine) {
                    this.assert("Online");
                    this.state = "Online";

                    // Attempt to reconnect immediately
                    this.emit({ action: "RETRY" });
                }
                break;
            }
            case "RETRY": {
                this.assert("Disconnected");
                this.client!.websocket.connect();
                this.state = "Connecting";
                break;
            }
            case "LOGOUT": {
                this.assert("Connecting", "Online", "Disconnected");
                this.state = "Ready";
                this.destroyClient();
                break;
            }
            case "OFFLINE": {
                this.state = "Offline";
                break;
            }
            case "ONLINE": {
                this.assert("Offline");
                this.state = "Ready";
                if (this.user_id) {
                    this.emit({ action: "RETRY" });
                }
                break;
            }
            default:
                throw new Error(`Unhandled action: ${data.action}`);
        }
    }

    @computed get ready() {
        return !!this.client?.user;
    }
}
