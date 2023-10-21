import axios from 'axios';
import Head from 'next/head';
import { useState } from 'react';

export default function Home() {
    const [url, setUrl] = useState('');
    const [summary, setSummary] = useState('');

    const fetchData = async () => {
        try {
            const response = await axios.get(url);
            await fetchSummary(response.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const fetchSummary = async (text: any) => {
        try {
            const response = await axios.post(
                'https://api.openai.com/v1/engines/davinci/completions',
                {
                    prompt: text,
                    // ... other API parameters ...
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    },
                }
            );
            setSummary(response.data.choices[0].text.trim());
        } catch (error) {
            console.error('Error fetching summary:', error);
        }
    };

    return (
        <>
            <Head>
                <title>Site Summary</title>
                <meta name="description" content="Site Summary" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <main className="p-2 bg-gray-200 dark:bg-gray-600 h-screen">
                <div className="flex flex-col gap-3 mb-4">
                    <div>
                        <label
                            htmlFor="first_name"
                            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                        >
                            URL
                        </label>
                        <input
                            type="text"
                            id="first_name"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Enter URL"
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            required
                        />
                    </div>
                    <button
                        className="w-40 py-2.5 px-5 mr-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                        disabled={!url}
                        onClick={fetchData}
                    >
                        Fetch Data
                    </button>
                </div>
                <div className="dark:text-white">
                    <h2 className="mb-2">Summary</h2>
                    <div className="h-96 rounded bg-gray-50 dark:bg-gray-700 overflow-scroll">
                        {summary}
                    </div>
                </div>
            </main>
        </>
    );
}
