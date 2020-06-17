import axios from 'axios';

const DEFAULT_ENDPOINT = 'https://daostack.buidlhub.com/register';

export interface IBuidlhubClient {
    endpoint: string,
    register(props:any): any
}

export default class BuidlhubClient implements IBuidlhubClient {
    endpoint:string;

    constructor(props:any = {}) {
        let endpoint:string = props.endpoint || DEFAULT_ENDPOINT;
        this.endpoint = endpoint;
        
    }

    async register(props:any = {}) {
        this._validatePropsExist(props, ['email', 'walletAddress'])

        const { email, walletAddress } = props;

        let r = await this._post( {
            walletAddress,
            email
        });
        return r;
    }

    private _validatePropsExist(props:any, requiredProps:any) {
        for (const propertyName of requiredProps) {
            const propertyValue = props[propertyName];
            if (!propertyValue) {
                throw new Error(`${propertyName} is required`);
            }
        }
    }

    async _post(body:any) {
        const url:string = this.endpoint;

        const options = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json;charset=UTF-8',
                'x-referrer': window?.location?.hostname,
            },
            data: JSON.stringify(body)
        };

        const r = await this._fetchWithRetry(url, options);
        console.log("Fetch response", r.data);

       const data:any = r.data;//response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        return {data};
    }

    async _fetchWithRetry(url:string, options:any, maxAttempts = 3) {
        let lastError = null;
        for (let i = 0; i < maxAttempts; i++) {
            try {
                return await axios(url, options); //fetch(url, options);
            } catch (error) {
                lastError = error;
            }

            // sleep before retry
            await new Promise(resolve => setTimeout(resolve, 250));
        }
        throw lastError;
    }
}
