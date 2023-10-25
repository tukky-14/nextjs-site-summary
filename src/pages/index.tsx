import axios from 'axios';
import Head from 'next/head';
import { useState } from 'react';
import OpenAI from 'openai';
import cheerio from 'cheerio';

const MAX_TOKENS = 16385;
const APPROX_CHARS_PER_TOKEN = 4; // この数値は言語やテキストの内容によって異なる場合がある
const MAX_CHARS = MAX_TOKENS / APPROX_CHARS_PER_TOKEN;
const URL_REGEX = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

export default function Home() {
    const [url, setUrl] = useState('');
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);

    const openai = new OpenAI({
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true,
    });

    const clearUrl = () => {
        setUrl('');
        setSummary('');
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            if (!URL_REGEX.test(url)) {
                alert('URLの形式に誤りがあります。');
                return;
            }

            setSummary('');
            const { data } = await axios(`/api/fetchData?url=${url}`);

            // HTMLを解析してbodyタグの中身を取得
            const $ = cheerio.load(data);
            const htmlDocument = $('div').text().replaceAll('\n', '');

            let bodyContents = htmlDocument.trim();
            console.log('bodyContents:', bodyContents);

            // トークンの上限を超える場合、テキストを切り詰める
            if (bodyContents?.length || 0 > MAX_CHARS) {
                bodyContents = bodyContents?.substring(0, MAX_CHARS);
            }

            await fetchSummary(bodyContents);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            setSummary('文章の取得に失敗しました。');
            console.error('Error fetching data:', error);
        }
    };

    const fetchSummary = async (contents: string) => {
        try {
            if (contents.length === 0) {
                setSummary('文章の取得に失敗しました。');
                return;
            }
            const chatCompletion = await openai.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content:
                            'あなたはプロのライターです。日本語に訳して要約して、小学生でも理解できる文章にして見やすく改行してください。200単語以内にしてください。要約の最初の文章は「このページは〜です」のように始めます。',
                    },
                    { role: 'user', content: contents },
                ],
                temperature: 0.5, // 生成テキストの多様性
                model: 'gpt-3.5-turbo-16k',
            });
            setSummary(chatCompletion.choices[0]?.message.content || '');
        } catch (error) {
            setLoading(false);
            alert('Error fetching summary');
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
                            onClick={(e: React.MouseEvent<HTMLInputElement>) =>
                                e.currentTarget.select()
                            }
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                if (e.key === 'Enter') {
                                    fetchData();
                                }
                            }}
                            placeholder="https://example.com"
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            required
                        />
                    </div>
                    <div className="flex gap-4">
                        <button
                            className="w-40 py-2.5 px-5 mr-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                            disabled={!url || loading}
                            onClick={fetchData}
                        >
                            {loading ? 'Loading...' : 'Submit'}
                        </button>
                        <button
                            className="w-40 py-2.5 px-5 mr-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                            disabled={loading}
                            onClick={clearUrl}
                        >
                            Clear
                        </button>
                    </div>
                </div>
                <div className="dark:text-white">
                    <h2 className="mb-2">Summary</h2>
                    <div
                        className="p-2 h-96 rounded bg-gray-50 dark:bg-gray-700 overflow-scroll"
                        dangerouslySetInnerHTML={{ __html: summary.replaceAll('\n', '<br>') }}
                    />
                </div>
            </main>
        </>
    );
}
