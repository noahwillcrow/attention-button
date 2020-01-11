export interface VapidDetails {
    readonly subject: string;

    readonly keys: {
        readonly public: string;
        readonly secret: string;
    };
}