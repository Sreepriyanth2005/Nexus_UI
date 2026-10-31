import { api } from "../../config/axios";
import { Skill } from "../../types/master.types";

export const getSkillsApi = async (): Promise<Skill[]> => {
  const res = await api.get("/skills");

  return (
    res.data?.data ||
    []
  );
};

export const getSkillByIdApi = async (
  skillId: string
): Promise<Skill> => {
  const res = await api.get(`/skills/${skillId}`);

  return res.data.data;
};

export const createSkillApi = async (
  payload: { name: string }
) => {
  const res = await api.post(
    "/skills",
    payload
  );

  return res.data;
};

export const updateSkillApi = async (
  skillId: string,
  payload: { name: string }
) => {
  const res = await api.put(
    `/skills/${skillId}`,
    payload
  );

  return res.data;
};

export const deleteSkillApi = async (
  skillId: string
) => {
  const res = await api.delete(
    `/skills/${skillId}`
  );

  return res.data;
};