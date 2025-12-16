export declare class UploadsController {
    uploadFile(folder: string, file: Express.Multer.File, req: any): {
        url: string;
    };
    listFiles(body: {
        path?: string;
    }, req: any): Promise<{
        name: string;
        type: string;
        path: string;
        size: number;
    }[]>;
}
