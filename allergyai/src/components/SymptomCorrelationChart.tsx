import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CorrelationData {
	allergen: string;
	count: number;
	avgSeverity: number;
}

interface Props {
	data: CorrelationData[];
}

export default function SymptomCorrelationChart({ data }: Props) {
	const maxCount = Math.max(...data.map(d => d.count), 1);

	const getSeverityColor = (severity: number) => {
		if (severity <= 2) return '#4CAF50';
		if (severity <= 3) return '#FF9800';
		return '#F44336';
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Symptom-Allergen Correlation</Text>
			<Text style={styles.subtitle}>Food eaten withing 24 hours before symptoms</Text>
			{data.length === 0 ? (
				<Text style={styles.emptyText}>No correlation data available</Text>
			) : (
					data.map((item, index) => (
						<View key={index} style={styles.row}>
							<Text style={styles.label}>{item.allergen}</Text>
							<View style={styles.barContainer}>
								<View
									style={[
										styles.bar, {
											width: `${(item.count / maxCount) * 100}%`,
											backgroundColor: getSeverityColor(item.avgSeverity)
										}
									]}
								/>
							</View>
							<Text style={styles.count}>{item.count}</Text>
						</View>
					))
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#fff',
		padding: 16,
		borderRadius: 8,
		marginBottom: 16,
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	subtitle: {
		color: '#666',
		marginBottom: 12,
		fontSize: 12,
	},
	emptyText: {
		color: '#666',
		textAlign: 'center',
		paddingVertical: 20,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
	},
	label: {
		width: 80,
		fontSize: 14,
	},
	barContainer: {
		flex: 1,
		height: 24,
		backgroundColor: '#f0f0f0',
		borderRadius: 4,
		marginHorizontal: 8,
	},
	bar: {
		height: '100%',
		borderRadius: 4,
	},
	count: {
		width: 30,
		fontSize: 14,
		fontWeight: 'bold',
		textAlign: 'right',
	},
});