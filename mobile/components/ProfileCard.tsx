import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Member } from '../lib/types';

const DEFAULT_NAME_BG = '#C7CEEA';

type Size = 'sm' | 'md' | 'lg';

export function ProfileCard({
  member,
  displayName,
  size = 'md',
}: {
  member: Member;
  displayName?: string;
  size?: Size;
}) {
  const nameBg = member.color?.trim() || DEFAULT_NAME_BG;
  const name = displayName ?? member.name;
  const hasImage = member.profileImageUrl != null && member.profileImageUrl.trim() !== '';
  const [imageError, setImageError] = useState(false);

  const isSm = size === 'sm';
  const isLg = size === 'lg';
  const avatarSize = isSm ? 40 : isLg ? 72 : 56;
  const nameSize = isSm ? 14 : isLg ? 22 : 16;
  const showFallback = !hasImage || imageError;

  return (
    <View style={styles.row}>
      <View style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
        {hasImage && !imageError ? (
          <Image
            source={{ uri: member.profileImageUrl! }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : null}
        {showFallback && (
          <Feather name="user" size={isSm ? 22 : isLg ? 40 : 28} color="#000" strokeWidth={2} />
        )}
      </View>
      <View style={styles.body}>
        <View style={[styles.nameBadge, { backgroundColor: nameBg }]}>
          <Text style={[styles.name, { fontSize: nameSize }]}>{name}</Text>
        </View>
        {member.statusMessage != null && member.statusMessage.trim() !== '' && (
          <Text style={styles.status} numberOfLines={2}>{member.statusMessage.trim()}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    backgroundColor: '#EBE5D9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  body: { flex: 1, minWidth: 0 },
  nameBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  name: {
    fontWeight: '700',
    color: '#2C2724',
  },
  status: {
    fontSize: 14,
    color: '#7A7265',
    marginTop: 6,
  },
});
