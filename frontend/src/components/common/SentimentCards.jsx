import { ThumbsUp, Minus, ThumbsDown } from 'lucide-react';

/**
 * Three-card sentiment breakdown row (positive / neutral / negative).
 *
 * Props:
 *  - data  ({ pozitive, neutre, negative, pctPozitive, pctNeutre, pctNegative })
 */
export default function SentimentCards({ data }) {
    if (!data) return null;

    return (
        <div className="mr-sentiment-row">
            <div className="mr-sentiment-card mr-sentiment--positive">
                <ThumbsUp size={20} />
                <div>
                    <span className="mr-sent-value">{data.pozitive}</span>
                    <span className="mr-sent-label">Pozitive ({data.pctPozitive}%)</span>
                </div>
            </div>
            <div className="mr-sentiment-card mr-sentiment--neutral">
                <Minus size={20} />
                <div>
                    <span className="mr-sent-value">{data.neutre}</span>
                    <span className="mr-sent-label">Neutre ({data.pctNeutre}%)</span>
                </div>
            </div>
            <div className="mr-sentiment-card mr-sentiment--negative">
                <ThumbsDown size={20} />
                <div>
                    <span className="mr-sent-value">{data.negative}</span>
                    <span className="mr-sent-label">Negative ({data.pctNegative}%)</span>
                </div>
            </div>
        </div>
    );
}
