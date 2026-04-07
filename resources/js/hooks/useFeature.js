import { useEffect, useState } from 'react';
import api from '../services/api';

/**
 * useFeature Hook - Check if user has access to a feature
 *
 * Usage:
 * const { hasFeature, loading } = useFeature('advanced-analytics');
 *
 * if (hasFeature) {
 *     // Render feature
 * }
 */
export function useFeature(featureSlug) {
    const [hasFeature, setHasFeature] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        checkFeature(featureSlug);
    }, [featureSlug]);

    const checkFeature = async (slug) => {
        try {
            setLoading(true);
            const response = await api.post(`/user/features/${slug}/check`);
            setHasFeature(response.data.has_feature || false);
            setError(null);
        } catch (err) {
            setHasFeature(false);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return {
        hasFeature,
        loading,
        error,
        recheck: () => checkFeature(featureSlug),
    };
}

/**
 * useFeatures Hook - Get all user features
 *
 * Usage:
 * const { features, loading } = useFeatures();
 *
 * if (features.includes('advanced-analytics')) {
 *     // User has this feature
 * }
 */
export function useFeatures() {
    const [features, setFeatures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadFeatures();
    }, []);

    const loadFeatures = async () => {
        try {
            setLoading(true);
            const response = await api.get('/user/features');
            setFeatures(response.data.features || []);
            setError(null);
        } catch (err) {
            setFeatures([]);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return {
        features,
        loading,
        error,
        has: (slug) => features.includes(slug),
        hasAny: (slugs) => slugs.some(slug => features.includes(slug)),
        reload: loadFeatures,
    };
}
