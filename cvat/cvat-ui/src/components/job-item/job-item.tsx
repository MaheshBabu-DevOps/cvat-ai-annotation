// Copyright (C) 2023-2024 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import './styles.scss';

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { Col, Row } from 'antd/lib/grid';
import Card from 'antd/lib/card';
import Text from 'antd/lib/typography/Text';
import Tag from 'antd/lib/tag';
import Select from 'antd/lib/select';
import Dropdown from 'antd/lib/dropdown';
import Icon from '@ant-design/icons';
import {
    BorderOutlined,
    LoadingOutlined, MoreOutlined, QuestionCircleOutlined,
} from '@ant-design/icons/lib/icons';
import { DurationIcon, FramesIcon } from 'icons';
import {
    Job, JobStage, JobState, JobType, Task, User,
} from 'cvat-core-wrapper';
import { useIsMounted } from 'utils/hooks';
import UserSelector from 'components/task-page/user-selector';
import CVATTooltip from 'components/common/cvat-tooltip';
import { useSelector } from 'react-redux';
import { CombinedState } from 'reducers';
import JobActionsMenu from './job-actions-menu';

interface Props {
    job: Job;
    task: Task;
    onJobUpdate: (job: Job, fields: Parameters<Job['save']>[0]) => void;
}

function ReviewSummaryComponent({ jobInstance }: { jobInstance: any }): JSX.Element {
    const [summary, setSummary] = useState<Record<string, any> | null>(null);
    const [error, setError] = useState<any>(null);
    const isMounted = useIsMounted();

    useEffect(() => {
        setError(null);
        jobInstance
            .issues(jobInstance.id)
            .then((issues: any[]) => {
                if (isMounted()) {
                    setSummary({
                        issues_unsolved: issues.filter((issue) => !issue.resolved).length,
                        issues_resolved: issues.filter((issue) => issue.resolved).length,
                    });
                }
            })
            .catch((_error: any) => {
                if (isMounted()) {
                    // eslint-disable-next-line
                    console.log(_error);
                    setError(_error);
                }
            });
    }, []);

    if (!summary) {
        if (error) {
            if (error.toString().includes('403')) {
                return <p>You do not have permissions</p>;
            }

            return <p>Could not fetch, check console output</p>;
        }

        return (
            <>
                <p>Loading.. </p>
                <LoadingOutlined />
            </>
        );
    }

    return (
        <table className='cvat-review-summary-description'>
            <tbody>
                <tr>
                    <td>
                        <Text strong>Unsolved issues</Text>
                    </td>
                    <td>{summary.issues_unsolved}</td>
                </tr>
                <tr>
                    <td>
                        <Text strong>Resolved issues</Text>
                    </td>
                    <td>{summary.issues_resolved}</td>
                </tr>
            </tbody>
        </table>
    );
}

function JobItem(props: Props): JSX.Element {
    const { job, task, onJobUpdate } = props;

    const deletes = useSelector((state: CombinedState) => state.jobs.activities.deletes);
    const deleted = job.id in deletes ? deletes[job.id] === true : false;

    const { stage } = job;
    const created = moment(job.createdDate);
    const updated = moment(job.updatedDate);
    const now = moment(moment.now());

    const style = {};
    if (deleted) {
        (style as any).pointerEvents = 'none';
        (style as any).opacity = 0.5;
    }
    const frameCountPercent = ((job.frameCount / (task.size || 1)) * 100).toFixed(0);
    const frameCountPercentRepresentation = frameCountPercent === '0' ? '<1' : frameCountPercent;
    return (
        <Col span={24}>
            <Card className='cvat-job-item' style={{ ...style }} data-row-id={job.id}>
                <Row align='middle'>
                    <Col span={7}>
                        <Row>
                            <Col>
                                <Link to={`/tasks/${job.taskId}/jobs/${job.id}`}>{`Job #${job.id}`}</Link>
                            </Col>
                            {
                                job.type === JobType.GROUND_TRUTH ? (
                                    <Col offset={1}>
                                        <Tag color='#ED9C00'>Ground truth</Tag>
                                    </Col>
                                ) : (
                                    <Col className='cvat-job-item-issues-summary-icon'>
                                        <CVATTooltip title={<ReviewSummaryComponent jobInstance={job} />}>
                                            <QuestionCircleOutlined />
                                        </CVATTooltip>
                                    </Col>
                                )
                            }
                        </Row>
                        <Row className='cvat-job-item-dates-info'>
                            <Col>
                                <Text>Created on </Text>
                                <Text type='secondary'>{`${created.format('MMMM Do YYYY HH:mm')}`}</Text>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <Text>Last updated </Text>
                                <Text type='secondary'>{`${updated.format('MMMM Do YYYY HH:mm')}`}</Text>
                            </Col>
                        </Row>
                    </Col>
                    <Col span={11}>
                        <Row className='cvat-job-item-selects' justify='space-between'>
                            <Col>
                                <Row>
                                    <Col className='cvat-job-item-select'>
                                        <Row>
                                            <Text>Assignee:</Text>
                                        </Row>
                                        <UserSelector
                                            className='cvat-job-assignee-selector'
                                            value={job.assignee}
                                            onSelect={(user: User | null): void => {
                                                if (job?.assignee?.id === user?.id) return;
                                                onJobUpdate(job, { assignee: user });
                                            }}
                                        />
                                    </Col>
                                    <Col className='cvat-job-item-select'>
                                        <Row justify='space-between' align='middle'>
                                            <Col>
                                                <Text>Stage:</Text>
                                            </Col>
                                        </Row>
                                        <Select
                                            className='cvat-job-item-stage'
                                            popupClassName='cvat-job-item-stage-dropdown'
                                            value={stage}
                                            onChange={(newValue: JobStage) => {
                                                onJobUpdate(job, { stage: newValue });
                                            }}
                                        >
                                            <Select.Option value={JobStage.ANNOTATION}>
                                                {JobStage.ANNOTATION}
                                            </Select.Option>
                                            <Select.Option value={JobStage.VALIDATION}>
                                                {JobStage.VALIDATION}
                                            </Select.Option>
                                            <Select.Option value={JobStage.ACCEPTANCE}>
                                                {JobStage.ACCEPTANCE}
                                            </Select.Option>
                                        </Select>
                                    </Col>
                                    <Col className='cvat-job-item-select'>
                                        <Row justify='space-between' align='middle'>
                                            <Col>
                                                <Text>State:</Text>
                                            </Col>
                                        </Row>
                                        <Select
                                            className='cvat-job-item-state'
                                            popupClassName='cvat-job-item-state-dropdown'
                                            value={job.state}
                                            onChange={(newValue: JobState) => {
                                                onJobUpdate(job, { state: newValue });
                                            }}
                                        >
                                            <Select.Option value={JobState.NEW}>
                                                {JobState.NEW}
                                            </Select.Option>
                                            <Select.Option value={JobState.IN_PROGRESS}>
                                                {JobState.IN_PROGRESS}
                                            </Select.Option>
                                            <Select.Option value={JobState.REJECTED}>
                                                {JobState.REJECTED}
                                            </Select.Option>
                                            <Select.Option value={JobState.COMPLETED}>
                                                {JobState.COMPLETED}
                                            </Select.Option>
                                        </Select>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </Col>
                    <Col span={5} offset={1}>
                        <Row className='cvat-job-item-details'>
                            <Col>
                                <Row>
                                    <Col>
                                        <Icon component={DurationIcon} />
                                        <Text>Duration: </Text>
                                        <Text type='secondary'>{`${moment.duration(now.diff(created)).humanize()}`}</Text>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col>
                                        <BorderOutlined />
                                        <Text>Frame count: </Text>
                                        <Text type='secondary' className='cvat-job-item-frames'>
                                            {`${job.frameCount} (${frameCountPercentRepresentation}%)`}
                                        </Text>
                                    </Col>
                                </Row>
                                {
                                    job.type !== JobType.GROUND_TRUTH && (
                                        <Row>
                                            <Col>
                                                <Icon component={FramesIcon} />
                                                <Text>Frame range: </Text>
                                                <Text type='secondary' className='cvat-job-item-frame-range'>
                                                    {`${job.startFrame}-${job.stopFrame}`}
                                                </Text>
                                            </Col>
                                        </Row>
                                    )
                                }
                            </Col>
                        </Row>
                    </Col>
                </Row>
                <Dropdown
                    trigger={['click']}
                    destroyPopupOnHide
                    overlay={<JobActionsMenu job={job} />}
                >
                    <MoreOutlined className='cvat-job-item-more-button' />
                </Dropdown>
            </Card>
        </Col>
    );
}

export default React.memo(JobItem);
